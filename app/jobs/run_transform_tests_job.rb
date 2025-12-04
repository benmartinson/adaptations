class RunTransformTestsJob < ApplicationJob
  queue_as :default

  rescue_from(ActiveRecord::RecordNotFound) do |_error|
    Rails.logger.warn("[RunTransformTestsJob] Task or Test not found, skipping job")
  end
  rescue_from(StandardError) do |error|
    handle_failure(error)
  end

  def perform(test_id)
    @test = Test.find(test_id)
    @task = @test.task
    code_body = @task.transform_code

    if code_body.blank?
      raise StandardError, "No transform code found to test"
    end

    broadcast_event(phase: "starting", message: "Starting test execution")

    test_result = run_single_test(@test, code_body)
    update_test_record(@test, test_result)

    broadcast_event(
      phase: "completed",
      message: "Test completed",
      output: { "test_results" => [test_result] },
      test_results: [test_result],
      tests: @task.tests.order(created_at: :desc).map { |t| serialize_test(t) },
      final: true
    )
  end

  private

  attr_reader :task, :test

  def run_single_test(test, code_body)
    test.update!(attempts: test.attempts + 1)

    from_response = test.from_response
    if from_response.blank?
      test.update!(status: "error", error_message: "No input data (from_response) found to test")
      message = {
        test_id: test.id,
        name: "Transform API Response",
        status: "error",
        error: "No input data (from_response) found to test",
      }
      broadcast_event(phase: "error", message: message, final: true)
      return message
    end

    expected_output = test.expected_output
    from_response = [from_response] unless from_response.is_a?(Array)
    
    # If no expected_output, run as execution-only test (passes if no error)
    if expected_output.blank?
      execute_without_comparison(test, code_body, from_response)
    else
      execute_transform_test(test, code_body, from_response, expected_output)
    end
  end

  def update_test_record(test, result)
    status = case result[:status]
             when "passed" then "pass"
             when "failed" then "fail"
             when "error" then "error"
             else "fail"
             end

    test.update!(
      status: status,
      actual_output: result[:output],
      error_message: result[:error]
    )
  end

  def serialize_test(t)
    {
      id: t.id,
      api_endpoint: t.api_endpoint,
      status: t.status,
      from_response: t.from_response,
      expected_output: t.expected_output,
      actual_output: t.actual_output,
      error_message: t.error_message,
      is_primary: t.is_primary,
      attempts: t.attempts,
      created_at: t.created_at,
      updated_at: t.updated_at
    }
  end

  def execute_without_comparison(test, code_body, from_response)
    output = execute_code(code_body, from_response)

    {
      test_id: test.id,
      name: "Transform API Response",
      status: "passed",
      input: from_response,
      output: output,
      expected_output: nil
    }
  rescue StandardError => e
    {
      test_id: test.id,
      name: "Transform API Response",
      status: "error",
      input: from_response,
      error: e.message
    }
  end

  def execute_transform_test(test, code_body, from_response, expected_output)
    output = execute_code(code_body, from_response)
    # Normalize both for comparison (convert to JSON and back to handle symbol/string keys)
    normalized_output = normalize_for_comparison(output)
    normalized_expected = normalize_for_comparison(expected_output)

    status = normalized_output == normalized_expected ? "passed" : "failed"

    {
      test_id: test.id,
      name: "Transform API Response",
      status: status,
      input: from_response,
      output: output,
      expected_output: expected_output
    }
  rescue StandardError => e
    {
      test_id: test.id,
      name: "Transform API Response",
      status: "error",
      input: from_response,
      error: e.message
    }
  end

  def normalize_for_comparison(data)
    JSON.parse(data.to_json)
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

