class RunTransformTestsJob < ApplicationJob
  queue_as :default

  rescue_from(ActiveRecord::RecordNotFound) do |_error|
    Rails.logger.warn("[RunTransformTestsJob] Task not found, skipping job")
  end
  rescue_from(StandardError) do |error|
    handle_failure(error)
  end

  def perform(task_id)
    @task = Task.find(task_id)
    run_tests
  end

  private

  attr_reader :task

  def run_tests
    broadcast_event(phase: "starting", message: "Starting test execution")

    code_body = task.input_payload.fetch("code", nil)
    
    if code_body.blank?
      raise StandardError, "No code found to test"
    end

    task.record_progress!(metadata: { "phase" => "testing", "test_results" => [] })

    test_results = execute_test_suite(code_body)

    task.record_progress!(metadata: { "phase" => "testing_complete", "test_results" => test_results })

    task.mark_completed!(
      output: {
        "test_results" => test_results,
        "code" => code_body,
      }
    )

    broadcast_event(
      phase: "completed",
      message: "Tests completed successfully",
      output: { "test_results" => test_results },
      test_results: test_results,
      final: true,
    )
  end

  def execute_test_suite(code_body)
    test_cases = Array(task.input_payload["test_cases"])
    return [] if test_cases.empty?

    results = []

    test_cases.each_with_index do |test_case, index|
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

