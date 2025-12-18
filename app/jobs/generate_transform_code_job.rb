class GenerateTransformCodeJob < ApplicationJob
  queue_as :default

  rescue_from(ActiveRecord::RecordNotFound) do |_error|
    Rails.logger.warn("[GenerateTransformCodeJob] Task not found, skipping job")
  end
  rescue_from(StandardError) do |error|
    handle_failure(error)
  end

  def perform(task_id)
    @task = Task.find(task_id)
    @active_ui_file = task.task_ui_files.find_by(is_active: true)
    @source_code_reference = @active_ui_file&.source_code
    run_code_generation
  end

  private

  attr_reader :task, :active_ui_file, :source_code_reference

  def run_code_generation
    task.update!(error_message: nil)
    broadcast_event(
      phase: "code_generation",
      message: "Generating transformation code",
      error_message: nil
    )

    code_prompt = build_prompt()
    raw_response = generate_code_response(code_prompt)
    code_body = sanitize_code(raw_response)

    task.update!(transform_code: code_body)
    broadcast_event(
      phase: "code_generated",
      message: "Code generated successfully",
      transform_code: code_body,
    )

    # Automatically re-run all tests for this task
    test_ids = task.tests.pluck(:id)
    if test_ids.any?
      RunTransformTestsJob.perform_later(test_ids)
    end
  end

  def build_prompt
    tests_needing_changes = task.tests.where(status: "changes_needed")

    if tests_needing_changes.exists?
      build_revision_prompt(tests_needing_changes)
    else
      build_initial_prompt
    end
  end

  def build_initial_prompt
    from_response = task.input_payload.fetch("from_response", [])
    to_response = task.response_json

    if task.kind == "link"
      "Can you write a ruby data transformation: def transformation_procedure(data) ...something... end
        Where the 'data' param is fetched data from an api endpoint and the example given is this data format: #{from_response}
        And you need to write a transformation function that prepares this data to call the target API endpoint: #{to_response}
        The transformation should return data in the format expected by the target API endpoint.
        \n\nRuby Code notes:
        1. No constant variables should be used. Only local variables should be used.
        2. You may use helper methods if needed.
        3. Only functions should be used. No classes or modules should be used.
        \n\n Here are specific extra instructions given by the user: #{task.data_description}
        This is important: only return the code, no other text or comments"
    else
      "Can you write a ruby data transformation: def transformation_procedure(data) ...something... end
        Where the 'data' param is fetched data from an api endpoint and the example given is this data format: #{from_response}
        And you need to write a transformation function that transforms the data into the 'data' prop object format expected by these React component(s): #{source_code_reference}
        \n\n Also, here are specific extra instructions given by the user (ignore if not relevant): #{task.data_description}
        This is important: only return the code, no other text or comments. You may use helper methods if needed."
    end
  end

  def build_revision_prompt(tests_needing_changes)
    if task.kind == "link"
      prompt = <<~PROMPT
      Previously, you recieved the instructions
      'Can you write a ruby data transformation: def transformation_procedure(data) ...something... end'
      And were given data from a source API and a target data prop object expected by React components.
        We've already attempted to write this transformation, but it needs changes. Here is the current code:

        ```ruby
        #{task.transform_code}
        ```
        Here are the React components that use the 'data' prop object. 
        You need to transform the data into the format expected by these components: #{source_code_reference}

        The following test cases need to be fixed:

      PROMPT
    else
      prompt = <<~PROMPT
      Previously, you recieved the instructions
      'Can you write a ruby data transformation: def transformation_procedure(data) ...something... end'
      And were given an intial (from_response) and expected (expected_output) data format.
        We've already attempted to write this transformation, but it needs changes. Here is the current code:

        ```ruby
        #{task.transform_code}
        ```

        The following test cases need to be fixed:

      PROMPT
    end

    tests_needing_changes.each_with_index do |test, index|
      has_error_message = test.error_message.present? && !test.error_message.start_with?("Docker") && !test.error_message.start_with?("Unknown sandbox error")
      prompt += <<~TEST_CASE
        --- Test Case #{index + 1} ---
        #{has_error_message ? "Error message: #{test.error_message}" : "No error message provided"}
        User feedback on what needs to change:
        #{test.notes.presence || "No specific notes provided"}

      TEST_CASE
    end

    if task.kind == "link"
      prompt += <<~FOOTER
        Please revise the transformation code to handle all the test cases above.
        The transformation should prepare data to call the target API endpoint.
        Return ONLY the revised code for: def transformation_procedure(data) ... end
        No other text or comments. No code comments either. You may use helper methods if needed.
      FOOTER
    else
      prompt += <<~FOOTER
        Please revise the transformation code to handle all the test cases above.
        Return ONLY the revised code for: def transformation_procedure(data) ... end
        No other text or comments. No code comments either. You may use helper methods if needed.
      FOOTER
    end

    prompt
  end

  def generate_code_response(prompt)
    response = GeminiChat.new.generate_response(prompt)
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

