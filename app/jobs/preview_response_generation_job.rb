class PreviewResponseGenerationJob < ApplicationJob
  queue_as :default

  rescue_from(ActiveRecord::RecordNotFound) do |_error|
    Rails.logger.warn("[PreviewResponseGenerationJob] Task not found, skipping job")
  end
  rescue_from(StandardError) do |error|
    handle_failure(error)
  end

  def perform(task_id)
    @task = Task.find(task_id)
    run_preview_response_generation
  end

  private

  attr_reader :task

  def run_preview_response_generation
    broadcast_event(
      phase: "preview_generation",
      message: "Generating preview response",
      progress: 0.1
    )
    
    api_endpoint = task.api_endpoint
    
    # Fetch data from the API endpoint
    from_response = fetch_endpoint_data(api_endpoint)
    system_tag = task.input_payload.fetch("system_tag", nil)
    data_description = task.input_payload.fetch("data_description", nil)
    
    to_response_example = "[{
      \"header\": \"Some string value selected from the api response that works as a header\",
      \"subheader\": \"Some string value selected from the api response that works as a subheader\",
      \"image_url\": \"Some url, something in the api response that leads to an image url (this is important)\",
      \"attributes\": {
        \"key\": \"value\",
        \"key2\": \"value2\"
        ...
        (you can have as many keys as you want, try to use data from the api response that is relevant to the header and subheader, 
        DO NOT use data that shouldn't be displayed in a typical UI, like internal ids, urls, create/update timestamps, etc. 
        Also if the value is null, do not include the attribute)
      },
      \"list_items\": [
        {
          \"header\": \"Some string value selected from the api response that works as a header\",
          \"subheader\": \"Some string value selected from the api response that works as a subheader\",
          \"image_url\": \"Some url, something in the api response that leads to an image url (this is important)\",
          \"attributes\": {
            \"key\": \"value\"
          }
        }
      ],
      \"list_items_header\": \"Some string value selected from the api response that works as a header for the list items\"
    }]"
    
    prompt = "You are a assistant that helps create a data visualization from an api response. 
    The user has selected an api endpoint and wants to create a data visualization from the response."
    
    if data_description.present?
      prompt += "\n\nThe user provided this description of the data: #{data_description}"
    end
    
    prompt += "\n\nHere are the results returned from the api endpoint: #{from_response} \n\n\
        We need data in this format, with these keys: #{to_response_example}\n\n
      But you need to select the data from the api response that works for each key. 
      If there is no data appropriate for a key, you can leave it blank. Only return the JSON response, no other text or comments."
    
    raw_response = generate_code_response(prompt)
    cleaned_response = extract_json(raw_response)
    response_json = JSON.parse(cleaned_response)
    
    # Save response_json, system_tag, and data_description to task
    task.update!(
      response_json: response_json,
      api_endpoint: api_endpoint,
      system_tag: system_tag,
      data_description: data_description,
      output_payload: {
        from_response: from_response
      }
    )
    
    broadcast_event(
      phase: "completed",
      message: "Workflow completed successfully",
      output: response_json,
      response_json: response_json,
      system_tag: system_tag,
      from_response: from_response,
      data_description: data_description,
      final: true
    ) 
  end

  def generate_code_response(prompt)
    response = GeminiChat.new.generate_response(prompt)
    response
  end


  def extract_json(raw_response)
    # Find the first occurrence of '[' or '{'
    start_index = raw_response.index(/[\[{]/)
    return raw_response.strip if start_index.nil?

    # Find the last occurrence of ']' or '}'
    end_index = raw_response.rindex(/[\]}]/)
    return raw_response.strip if end_index.nil?

    # Extract the substring between start and end (inclusive)
    raw_response[start_index..end_index].strip
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

