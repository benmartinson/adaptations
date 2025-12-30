class RunLinkTransformTestsJob < ApplicationJob
  queue_as :default

  rescue_from(ActiveRecord::RecordNotFound) do |_error|
    Rails.logger.warn("[RunLinkTransformsJob] Task not found, skipping job")
  end
  rescue_from(StandardError) do |error|
    handle_failure(error)
  end

  # Accepts either a single test_id or an array of test_ids
  def perform(test_ids)
    @test_ids = Array(test_ids)
    @tests = Test.where(id: @test_ids).includes(:task)
    @task = Task.where(kind: "subtask_connector").find_by(id: @tests.first.task_id)

    if @tests.empty?
      Rails.logger.warn("[RunLinkTransformsJob] No tests found, skipping job")
      return
    end

    @task = @tests.first.task
    run_link_transforms
  end

  private

  attr_reader :task, :tests

  def run_link_transforms
    # Mark all tests as pending and increment attempts
    tests.each do |test|
      test.update!(status: "pending", attempts: test.attempts + 1)
    end

    broadcast_event(
      phase: "running",
      message: "Running #{tests.count} link transform test(s)",
      tests: tests.map { |t| serialize_test(t.reload) },
      final: false
    )

    begin      
      test_inputs = tests.map do |test|
        from_task = Task.where(kind: "api_transform").find_by(system_tag: task.system_tag)
        to_task = Task.where(kind: "api_transform").find_by(system_tag: task.to_system_tag)
        {
          test_id: test.id,
          from_api_endpoint: test.from_response,
          to_api_endpoint: test.expected_output,
          from_transform: from_task.transform_code,
          to_transform: to_task.transform_code,
          link_transform: task.transform_code,
        }
      end

      results = execute_batch(test_inputs)

      results.each do |result|
        test = tests.find { |t| t.id == result["test_id"] }
        next unless test
        if result["success"]
          test.update!(status: "pass", actual_output: result["output"], error_message: nil)
        elsif result["output"].present?
          # Test ran but output didn't match expected - mark as fail
          test.update!(status: "fail", error_message: result["error"], actual_output: result["output"])
        else
          # Actual error during execution
          test.update!(status: "error", error_message: result["error"], actual_output: result["output"])
        end
      end

      broadcast_event(
        phase: "completed",
        message: "Link transform tests completed",
        tests: tests.map { |t| serialize_test(t.reload) },
        final: true
      )
    rescue StandardError => e
      # If the entire batch fails, mark all tests as error
      tests.each do |test|
        test.update!(status: "error", error_message: e.message)
      end

      broadcast_event(
        phase: "completed",
        message: "Link transform tests failed with error",
        tests: tests.map { |t| serialize_test(t.reload) },
        final: true
      )
    end
  end

  def execute_batch(test_inputs)
    test_inputs.map do |test_input|
      begin
        from_data = fetch_endpoint_data(test_input[:from_api_endpoint])
        first_output = execute_transform(test_input[:from_transform], from_data)
        second_output = execute_transform(test_input[:link_transform], first_output)
        to_endpoint = second_output.to_s.strip
        if to_endpoint.blank?
          raise StandardError, "Link transformation did not produce a valid endpoint"
        end

        expected_output = test_input[:to_api_endpoint].to_s.strip
        if to_endpoint == expected_output
          { "test_id" => test_input[:test_id], "success" => true, "output" => to_endpoint }
        else
          { "test_id" => test_input[:test_id], "success" => false, "output" => to_endpoint, "error" => "Expected: #{expected_output}, Got: #{to_endpoint}" }
        end
      rescue StandardError => e
        { "test_id" => test_input[:test_id], "success" => false, "error" => e.message }
      end
    end
  end

  def execute_transform(code_body, input)
    return input if code_body.blank?

    begin
      # Try using RubySandbox first
      RubySandbox.run(code_body, input)
    rescue StandardError
      # Fallback to inline evaluation
      evaluate_inline(code_body, input)
    end
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
      test_type: t.test_type,
      created_at: t.created_at,
      updated_at: t.updated_at
    }
  end

  def handle_failure(error)
    return unless tests&.any?

    tests.each do |test|
      test.update!(status: "error", error_message: error.message)
    end

    broadcast_event(
      phase: "error",
      message: error.message,
      tests: tests.map { |t| serialize_test(t.reload) },
      backtrace: Rails.env.development? ? Array(error.backtrace).first(5) : nil,
      final: true
    )
  end
end
