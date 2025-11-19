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
    task_type = task.input_payload.fetch("task_type", "code_workflow")
    if task_type == "transformed_response_generation"
      run_transformed_response_generation
    else
      run_workflow
    end
  end

  private

  attr_reader :task

  def run_transformed_response_generation
    from_response = task.input_payload.fetch("from_response", [])
    to_response_example = "[{
      \"header\": \"Some string value selected from the api response that works as a header\",
      \"subheader\": \"Some string value selected from the api response that works as a subheader\",
      \"image_url\": \"Some string value selected from the api response that works as a image url\",

    }]"
    prompt = "You are a assistant that helps create a data visualization from an api response. 
    The user has selected an api endpoint and wants to create a data visualization from the response.
    Here are the results returned from the api endpoint: #{from_response} \n\n\
        We need data in this format, with these keys: #{to_response_example}\n\n
      But you need to select the data from the api response that works for each key. 
      If there is no data appropriate for a key, you can leave it blank. Only return the JSON response, no other text or comments."
    raw_response = generate_code_response(prompt)
    cleaned_response = extract_json(raw_response)
    response_json = JSON.parse(cleaned_response)
    
    # Save response_json to task field
    task.update!(response_json: response_json)
    
    task.mark_completed!(
      output: {
        "response_json" => response_json,
      }
    )
    broadcast_event(
      phase: "completed",
      message: "Workflow completed successfully",
      output: response_json,
      final: true
    ) 
  end

  def run_workflow
    task.mark_running!
    broadcast_event(phase: "starting", message: "Starting code workflow")

    task.record_progress!(metadata: { "phase" => "code_generation", "latest_code" => "Generating..." })
    broadcast_event(
      phase: "code_generation",
      message: "Generated code",
    )

    code_prompt = build_prompt()
    raw_response = generate_code_response(code_prompt)
    code_body = sanitize_code(raw_response)
    from_response_payload =   {
      "entries": [
        {
          "key": "/works/OL44337192W",
          "covers": [
            9003030
          ],
          "title": "Fabeldieren & Waar Ze Te Vinden"
        }
      ]
    }

    # test_results = execute_test_suite(code_body)
    # task.record_progress!(metadata: { "phase" => "testing", "test_results" => test_results })

    return handle_cancellation! if cancellation_requested?

    task.record_progress!(metadata: { "phase" => "executing_code", "latest_code" => code_body })
    broadcast_event(
      phase: "executing_code",
      message: "Executing code",
      code: code_body,
      metadata: {
        "latest_code" => code_body,
      }
    )

    response = execute_code(code_body, from_response_payload)
    task.mark_completed!(
      output: {
        "code" => code_body,
        "response" => response,
        "from_response" => from_response_payload,
      }
    )

    broadcast_event(
      phase: "completed",
      message: "Workflow completed successfully",
      output: response,
      final: true,
    )
  end

  def build_prompt()
    from_response = task.input_payload.fetch("from_response", [])
    to_response = task.input_payload.fetch("to_response", [])

    "Can you write a ruby data transformation: def transformation_procedure(data) ...something... end 
        Where the 'data' param is a list of records in this data format: #{from_response} 
        And transforms the data into a list of records in this format: #{to_response}
        This is important: only return the code, no other text or comments."
  end

  def generate_code_response(prompt)
    response = GeminiChat.new.generate_response(prompt)
    # record_token_usage(prompt: prompt, completion: response)
    response
  end

  def sanitize_code(response)
    code = response.dup
    code = code.gsub("\\n", "\n")
    code = code.gsub(/```ruby?\s*/i, "")
    code = code.gsub(/```\s*/i, "")

    heredoc_match = code.match(/^<<~?RUBY\s*\n(.*)\nRUBY\s*$/m)
    code = heredoc_match[1] if heredoc_match

    code.strip
  end

  def extract_json(raw_response)
    # Find the first occurrence of '[' or '{'
    start_index = raw_response.index(/[\[{]/)
    return raw_response.strip if start_index.nil?

    # Find the last occurrence of ']' or '}'
    end_index = raw_response.rindex(/[\]}]/)
    return raw_response.strip if end_index.nil?

    # Extract the substring between start and end (inclusive)
    raw_response[start_index..end_index].strip
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

