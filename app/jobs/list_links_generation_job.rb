class ListLinksGenerationJob < ApplicationJob
  queue_as :default

  rescue_from(ActiveRecord::RecordNotFound) do |_error|
    Rails.logger.warn("[ListLinksGenerationJob] Task not found, skipping job")
  end
  rescue_from(StandardError) do |error|
    handle_failure(error)
  end

  # Generates transform_code for a list_link_connector task
  # The transform_code will add link_endpoint to each item in an array
  #
  # @param task_id [Integer] The list_link_connector task ID
  # @param example_mappings [Array<Hash>] Array of { item: Hash, endpoint: String }
  def perform(task_id, example_mappings)
    @task = Task.find(task_id)
    @example_mappings = example_mappings

    unless @task.kind == "list_link_connector"
      raise StandardError, "Task must be of kind 'list_link_connector'"
    end

    run_code_generation
  end

  private

  attr_reader :task, :example_mappings

  def run_code_generation
    task.update!(error_message: nil)
    broadcast_event(
      phase: "code_generation",
      message: "Generating link endpoint transformation code",
      error_message: nil
    )

    code_prompt = build_prompt
    raw_response = generate_code_response(code_prompt)
    code_body = extract_code(raw_response)

    task.update!(transform_code: code_body)
    broadcast_event(
      phase: "code_generated",
      message: "Link endpoint transformation code generated successfully",
      transform_code: code_body
    )
  end

  def build_prompt
    examples_text = example_mappings.map.with_index do |mapping, index|
      <<~EXAMPLE
        Example #{index + 1}:
        Input item: #{mapping[:item].to_json}
        Expected endpoint: #{mapping[:endpoint]}
      EXAMPLE
    end.join("\n")

    <<~PROMPT
      Write a Ruby transformation function that takes a single item from an array and returns
      the API endpoint URL that should be used to fetch detailed data for that item.

      The function signature must be:
      def transformation_procedure(item)
        # Extract data from item and construct the endpoint URL
        # Return the endpoint URL as a string
      end

      Here are examples of input items and their corresponding endpoint URLs:

      #{examples_text}

      Requirements:
      1. The function should work for ANY item in the array, not just the examples
      2. Analyze the pattern between the input data and the endpoint URL
      3. Extract the relevant identifier(s) from the item and construct the endpoint
      4. Return ONLY the endpoint URL as a string
      5. No constant variables - only local variables
      6. You may use helper methods if needed
      7. Only functions should be used - no classes or modules

      Return ONLY the Ruby code, no explanations or comments.
    PROMPT
  end

  def generate_code_response(prompt)
    GeminiChat.new.generate_response(prompt)
  end


  def handle_failure(error)
    return unless task

    task.mark_failed!(error.message) if task.respond_to?(:mark_failed!)
    broadcast_event(
      phase: "error",
      message: error.message,
      backtrace: Rails.env.development? ? Array(error.backtrace).first(5) : nil,
      final: true
    )
  end
end

