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

    code_body = task.transform_code
    
    if code_body.blank?
      raise StandardError, "No transform code found to test"
    end

    from_response = task.input_payload.fetch("from_response", nil)
    if from_response.blank?
      raise StandardError, "No input data (from_response) found to test"
    end

    expected_output = task.response_json
    if expected_output.blank?
      raise StandardError, "No expected output (response_json) found to compare"
    end

    from_response = [from_response] unless from_response.is_a?(Array)
    test_results = run_transform_test(code_body, from_response, expected_output)
    broadcast_event(
      phase: "completed",
      message: "Tests completed successfully",
      output: { "test_results" => test_results },
      test_results: test_results,
      final: true,
    )
  end

  def run_transform_test(code_body, from_response, expected_output)
    output = execute_code(code_body, from_response)
    # Normalize both for comparison (convert to JSON and back to handle symbol/string keys)
    normalized_output = normalize_for_comparison(output)
    normalized_expected = normalize_for_comparison(expected_output)

    status = normalized_output == normalized_expected ? "passed" : "failed"

    {
      name: "Transform API Response",
      status: status,
      input: from_response,
      output: output,
      expected_output: expected_output
    }
  rescue StandardError => e
    {
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
  rescue StandardError => e
    binding.pry
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

