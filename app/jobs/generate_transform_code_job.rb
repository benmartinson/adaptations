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
    run_code_generation
  end

  private

  attr_reader :task

  def run_code_generation
    broadcast_event(
      phase: "code_generation",
      message: "Generating transformation code",
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
    to_response = task.input_payload.fetch("to_response", [])

    "Can you write a ruby data transformation: def transformation_procedure(data) ...something... end 
        Where the 'data' param is a list of records in this data format: #{from_response} 
        And transforms the data into a list of records in this format: #{to_response}
        \n\n Here are specific extra instructions given by the user: #{task.data_description}
        This is important: only return the code, no other text or comments."
  end

  def build_revision_prompt(tests_needing_changes)
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

    tests_needing_changes.each_with_index do |test, index|
      prompt += <<~TEST_CASE
        --- Test Case #{index + 1} ---
        Input data (from_response):
        #{test.from_response.to_json}

        Expected output:
        #{test.expected_output.to_json}

        User feedback on what needs to change:
        #{test.notes.presence || "No specific notes provided"}

      TEST_CASE
    end

    prompt += <<~FOOTER
      Please revise the transformation code to handle all the test cases above.
      Return ONLY the revised code for: def transformation_procedure(data) ... end
      No other text or comments. No code comments either. You may use helper methods if needed.
    FOOTER

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

