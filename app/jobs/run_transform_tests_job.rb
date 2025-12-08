class RunTransformTestsJob < ApplicationJob
  queue_as :default

  rescue_from(ActiveRecord::RecordNotFound) do |_error|
    Rails.logger.warn("[RunTransformTestsJob] Test not found, skipping job")
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

    broadcast_event(phase: "running", message: "Running test")

    run_test(code_body)
  end

  private

  attr_reader :test, :task

  def run_test(code_body)
    test.update!(status: "pending", attempts: test.attempts + 1)

    begin
      # Get the from_response data for this test
      from_response = test.from_response
      if from_response.blank?
        raise StandardError, "No from_response data available for test"
      end

      # Run the transform
      from_response_array = from_response.is_a?(Array) ? from_response : [from_response]
      output = execute_code(code_body, from_response_array)

      # Determine status based on test type
      if test.is_primary
        # Primary test: passes if transform runs without error
        test.update!(status: "pass", actual_output: output)
      else
        # Non-primary test: needs review after successful transform
        test.update!(status: "pending", actual_output: output)
      end

      broadcast_event(
        phase: "completed",
        message: "Test completed",
        tests: [serialize_test(test.reload)],
        final: true
      )
    rescue StandardError => e
      test.update!(status: "error", error_message: e.message)

      broadcast_event(
        phase: "completed",
        message: "Test failed with error",
        tests: [serialize_test(test.reload)],
        final: true
      )
    end
  end

  def outputs_match?(actual, expected)
    return false if actual.nil? || expected.nil?
    
    # Normalize both to JSON strings for comparison
    normalize(actual) == normalize(expected)
  end

  def normalize(obj)
    JSON.parse(obj.to_json)
  rescue
    obj
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
      description: t.description,
      notes: t.notes,
      attempts: t.attempts,
      created_at: t.created_at,
      updated_at: t.updated_at
    }
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
    return unless test

    test.update!(status: "error", error_message: error.message)
    broadcast_event(
      phase: "error",
      message: error.message,
      tests: [serialize_test(test.reload)],
      backtrace: Rails.env.development? ? Array(error.backtrace).first(5) : nil,
      final: true
    )
  end
end
