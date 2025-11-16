class CodeWorkflowJob < ApplicationJob
  queue_as :default

  rescue_from(ActiveRecord::RecordNotFound) do |_error|
    Rails.logger.warn("[CodeWorkflowJob] Task not found, skipping job")
  end
  rescue_from(StandardError) do |error|
    handle_failure(error)
  end

  def perform(task_id)
    @task = Task.find(task_id)
    return if @task.cancelled?

    run_workflow
  end

  private

  attr_reader :task

  def run_workflow
    task.mark_running!
    broadcast_event(phase: "starting", message: "Starting code workflow")

    instructions = fetch_instructions
    broadcast_event(phase: "planning", message: "Planning solution", instructions: instructions)

    code_prompt = build_prompt(instructions)
    raw_response = generate_code_response(code_prompt)
    code_body = sanitize_code(raw_response)

    task.record_progress!(metadata: { "phase" => "code_generation", "latest_code" => code_body })
    broadcast_event(
      phase: "code_generation",
      message: "Generated initial implementation",
      code: code_body
    )

    return handle_cancellation! if cancellation_requested?

    test_results = execute_test_suite(code_body)
    task.record_progress!(metadata: { "phase" => "testing", "test_results" => test_results })

    return handle_cancellation! if cancellation_requested?

    task.mark_completed!(
      output: {
        "code" => code_body,
        "tests" => test_results,
        "instructions" => instructions
      }
    )

    broadcast_event(
      phase: "completed",
      message: "Workflow completed successfully",
      output: task.output_payload,
      final: true
    )
  end

  def fetch_instructions
    payload = task.input_payload || {}
    payload["instructions"].presence || "Write a Ruby function that transforms the provided input data."
  end

  def build_prompt(instructions)
    examples = task.input_payload.fetch("examples", [])
    tests = task.input_payload.fetch("test_cases", [])

    <<~PROMPT
      You are an expert Ruby engineer. You will receive instructions that describe
      a transformation that should be implemented as pure Ruby code. Return only
      executable Ruby, avoid extraneous prose. 
      The main parent method should be named transformation_procedure and take a single parameter called data.

      Instructions:
      #{instructions}

      Example inputs:
      #{examples.to_json}

      Tests to satisfy:
      #{tests.to_json}
    PROMPT
  end

  def generate_code_response(prompt)
    response =
      if gemini_available?
        GeminiChat.new.generate_response(prompt)
      else
        fallback_code
      end

    record_token_usage(prompt: prompt, completion: response)
    response
  end

  def gemini_available?
    ENV["GEMINI_API_KEY"].present?
  end

  def fallback_code
    sample = task.input_payload["sample_code"]
    return sample if sample.present?

    <<~RUBY
      def transformation_procedure(data)
        data
      end
    RUBY
  end

  def sanitize_code(response)
    return fallback_code if response.blank?

    code = response.dup
    code = code.gsub("\\n", "\n")
    code = code.gsub(/```ruby?\s*/i, "")
    code = code.gsub(/```\s*/i, "")

    heredoc_match = code.match(/^<<~?RUBY\s*\n(.*)\nRUBY\s*$/m)
    code = heredoc_match[1] if heredoc_match

    code.strip
  end

  def execute_test_suite(code_body)
    test_cases = Array(task.input_payload["test_cases"])
    return [] if test_cases.empty?

    results = []

    test_cases.each_with_index do |test_case, index|
      break if cancellation_requested?

      broadcast_event(
        phase: "testing",
        message: "Running #{test_case["name"].presence || "test #{index + 1}"}",
        code: code_body,
        test_case: test_case
      )

      result = run_single_test(code_body, test_case, index)
      results << result

      broadcast_event(
        phase: "testing",
        message: "Finished #{test_case["name"].presence || "test #{index + 1}"} (#{result[:status]})",
        test_result: result
      )
    end

    results
  end

  def run_single_test(code_body, test_case, index)
    input = test_case["input"] || {}
    expected = test_case["expected_output"]

    output = execute_code(code_body, input)

    status =
      if expected.nil?
        "completed"
      elsif output == expected
        "passed"
      else
        "failed"
      end

    {
      name: test_case["name"].presence || "Test #{index + 1}",
      status: status,
      input: input,
      output: output,
      expected_output: expected
    }
  rescue StandardError => e
    {
      name: test_case["name"].presence || "Test #{index + 1}",
      status: "error",
      input: input,
      error: e.message
    }
  end

  def execute_code(code_body, input)
    RubySandbox.run(code_body, input)
  rescue StandardError
    evaluate_inline(code_body, input)
  end

  def evaluate_inline(code_body, input)
    sandbox_module = Module.new
    sandbox_module.module_eval(code_body)
    receiver = Object.new
    receiver.extend(sandbox_module)

    if receiver.respond_to?(:transformation_procedure)
      receiver.public_send(:transformation_procedure, input)
    else
      raise StandardError, "transformation_procedure is not defined in generated code"
    end
  rescue StandardError => e
    raise(StandardError, "Inline evaluation failed: #{e.message}")
  end

  def cancellation_requested?
    task.reload.cancelled?
  end

  def handle_cancellation!
    task.update!(finished_at: Time.current)
    broadcast_event(
      phase: "cancelled",
      message: "Task cancelled",
      final: true
    )
  end

  def record_token_usage(prompt:, completion:)
    prompt_tokens = estimate_tokens(prompt)
    completion_tokens = estimate_tokens(completion)
    task.increment_tokens!(prompt: prompt_tokens, completion: completion_tokens)
  end

  def estimate_tokens(text)
    return 0 if text.blank?

    (text.split(/\s+/).size * 1.3).ceil
  end

  def broadcast_event(data)
    channel_class = "TaskChannel".safe_constantize
    payload = {
      task_id: task.id,
      status: task.status,
      tokens: {
        prompt: task.tokens_prompt,
        completion: task.tokens_completion,
        total: task.tokens_total
      },
      timestamp: Time.current.iso8601
    }.merge(data)

    channel_class&.broadcast_to(task, payload)
  end

  def handle_failure(error)
    return unless task

    task.mark_failed!(error.message)
    broadcast_event(
      phase: "error",
      message: error.message,
      backtrace: Rails.env.development? ? Array(error.backtrace).first(5) : nil,
      final: true
    )
  end
end

