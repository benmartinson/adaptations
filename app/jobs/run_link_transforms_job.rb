class RunLinkTransformsJob < ApplicationJob
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
        {
          test_id: test.id,
          input: test.from_response
          expected_output: test.expected_output
        }
      end

      # Process results for each test
      results = execute_batch(test_inputs, from_task, to_task)

      # Process results
      results.each do |result|
        test = tests.find { |t| t.id == result["test_id"] }
        next unless test

        if result["success"]
          output = result["output"]
          if test.is_primary
            # Primary test: passes if transform runs without error
            test.update!(status: "pass", actual_output: output)
          else
            # Non-primary test: needs review after successful transform
            test.update!(status: "needs_review", actual_output: output)
          end
        else
          test.update!(status: "error", error_message: result["error"])
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

  def execute_batch(test_inputs, from_task, to_task)
    # Run link transformations for each test input
    test_inputs.map do |test_input|
      begin
        # Step 1: For link tests, test.from_response contains the from_task.api_endpoint URL
        # Fetch data from that URL to get the actual input data
        from_data = fetch_endpoint_data(test_input[:input])
        first_output = execute_transform(from_task.transform_code, from_data)

        # Step 2: Run link task transformation
        second_output = execute_transform(task.transform_code, first_output)

        # Step 3: Use second_output as endpoint for to_task
        to_endpoint = second_output.to_s.strip
        if to_endpoint.blank?
          raise StandardError, "Link transformation did not produce a valid endpoint"
        end

        # Step 4: Fetch data from generated endpoint
        to_data = fetch_endpoint_data(to_endpoint)

        # Step 5: Run final transformation
        final_output = execute_transform(to_task.transform_code, [to_data])

        { "test_id" => test_input[:test_id], "success" => true, "output" => final_output }
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
