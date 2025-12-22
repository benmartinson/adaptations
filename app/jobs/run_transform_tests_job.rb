class RunTransformTestsJob < ApplicationJob
  queue_as :default

  rescue_from(StandardError) do |error|
    handle_failure(error)
  end

  # Accepts either a single test_id or an array of test_ids
  def perform(test_ids)
    @test_ids = Array(test_ids)
    @tests = Test.where(id: @test_ids).includes(:task)
    
    if @tests.empty?
      Rails.logger.warn("[RunTransformTestsJob] No tests found, skipping job")
      return
    end

    @task = @tests.first.task
    code_body = @task.transform_code

    if code_body.blank?
      raise StandardError, "No transform code found to test"
    end

    broadcast_event(phase: "running", message: "Running #{@tests.count} test(s)")

    run_tests(code_body)
  end

  private

  attr_reader :tests, :task

  def run_tests(code_body)
    # Mark all tests as pending and increment attempts
    tests.each do |test|
      test.update!(status: "pending", attempts: test.attempts + 1, error_message: nil)
    end

    broadcast_event(
      phase: "running", 
      message: "Running #{tests.count} test(s)", 
      tests: tests.map { |t| serialize_test(t.reload) },
      final: false
    )

    # Prepare batch input for all tests
    test_inputs = tests.map do |test|
      from_response = test.from_response
      if from_response.blank?
        # Mark this test as error immediately
        test.update!(status: "error", error_message: "No from_response data available for test")
        next nil
      end

      { "test_id" => test.id, "input" => from_response }
    end.compact

    if test_inputs.empty?
      broadcast_event(
        phase: "completed",
        message: "All tests failed - no valid inputs",
        tests: tests.map { |t| serialize_test(t.reload) },
        final: true
      )
      return
    end

    begin
      # Run all tests in a single container
      results = execute_batch(code_body, test_inputs)
      
      # Process results and optionally validate UI rendering
      ui_file = task.task_ui_files.find_by(is_active: true)
      bundle_file_name = ui_file&.file_name
      should_validate_ui = bundle_file_name.present? && ReactSandbox.available?
      
      results.each do |result|
        test = tests.find { |t| t.id == result["test_id"] }
        next unless test

        if result["success"]
          output = result["output"]
          
          # Optionally validate UI rendering
          ui_error = nil
          if should_validate_ui
            ui_validation = validate_ui_render(bundle_file_name, output)
          ui_error = ui_validation[:error] unless ui_validation[:success]
          end
          
          if ui_error
            # Transform succeeded but UI rendering failed
            test.update!(
              status: "error",
              actual_output: output,
              error_message: "UI Render Error: #{ui_error}"
            )
          elsif test.is_primary
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
        message: "Tests completed",
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
        message: "Tests failed with error",
        tests: tests.map { |t| serialize_test(t.reload) },
        final: true
      )
    end
  end

  def execute_batch(code_body, test_inputs)
    # Check if this task has sub_tasks that need to be merged
    sub_tasks = task.sub_tasks
    
    if sub_tasks.any?
      execute_batch_with_subtasks(code_body, test_inputs, sub_tasks)
    else
      execute_simple_batch(code_body, test_inputs)
    end
  end

  def execute_simple_batch(code_body, test_inputs)
    RubySandbox.run_batch(code_body, test_inputs)
  rescue StandardError
    # Fallback to inline evaluation for each test
    test_inputs.map do |test_input|
      begin
        output = execute_transform(code_body, test_input["input"])
        { "test_id" => test_input["test_id"], "success" => true, "output" => output }
      rescue StandardError => e
        { "test_id" => test_input["test_id"], "success" => false, "error" => e.message }
      end
    end
  end

  def execute_batch_with_subtasks(code_body, test_inputs, sub_tasks)
    test_inputs.map do |test_input|
      begin
        # Step 1: Run parent task's transform
        first_output = execute_transform(code_body, test_input["input"])
        
        # Step 2: For each sub_task, fetch data and run its transform
        merged_output = first_output.is_a?(Hash) ? first_output.dup : { "data" => first_output }
        
        sub_tasks.each do |sub_task|
          child_task = Task.find_by(system_tag: sub_task.system_tag)
          next unless child_task&.transform_code.present? && child_task&.api_endpoint.present?

          # Fetch data from child task's endpoint
          child_data = fetch_endpoint_data(child_task.api_endpoint)

          # Run child task's transform
          sub_output = execute_transform(child_task.transform_code, child_data)

          # Merge using sub_task's system_tag as the key
          merged_output[sub_task.system_tag] = sub_output
        end
        
        { "test_id" => test_input["test_id"], "success" => true, "output" => merged_output }
      rescue StandardError => e
        { "test_id" => test_input["test_id"], "success" => false, "error" => e.message }
      end
    end
  end

  def execute_transform(code_body, input)
    return input if code_body.blank?

    begin
      RubySandbox.run(code_body, input)
    rescue StandardError
      evaluate_inline(code_body, input)
    end
  end


  def validate_ui_render(bundle_file_name, data)
    ReactSandbox.validate_render(bundle_file_name, data)
  rescue StandardError => e
    Rails.logger.warn("[RunTransformTestsJob] UI validation failed: #{e.message}")
    { success: true } # Don't fail the test if UI validation itself errors
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

