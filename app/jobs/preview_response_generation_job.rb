class PreviewResponseGenerationJob < ApplicationJob
  queue_as :default

  rescue_from(ActiveRecord::RecordNotFound) do |_error|
    Rails.logger.warn("[PreviewResponseGenerationJob] Task not found, skipping job")
  end
  rescue_from(StandardError) do |error|
    handle_failure(error)
  end

  def perform(task_id, notes = nil)
    @task = Task.find(task_id)
    run_preview_response_generation(notes)
  end

  private

  attr_reader :task

  def run_preview_response_generation(notes = nil)
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

    # Generate React components for data visualization
    component_code = generate_react_components(from_response, data_description, notes)
    bundle_path = save_and_build_component_bundle(component_code)
    
    prompt = "You are a assistant that helps create a data visualization from an api response. 
    The user has selected an api endpoint and wants to create a data visualization from the response. The user has provided
    React components that will be used to visualize the data. There should be one default component that is exported, it takes a single 'data' prop (object).
    You need to transform the data from the api response into the object that is expected by this component that accepts this 'data' prop. If there is data
    in the api response that is not relevant to the data visualization, you should still include it in the object anyways, unless told otherwise by the user (in the data_description)."

    prompt += "\n\nHere are the results returned from the api endpoint: #{from_response} \n\n\
    You need to transform the data from the api response into the object that is expected by this component that accepts this 'data' prop. 
    The object will be represented as a JSON object and is what will be passed to the component as the 'data' prop.
    So you need to select the data from the api response that is used by the component 'data' prop, as you see it being used in the component.
    Only return the JSON response, no other text or comments."

    prompt += "\n\nHere is the data_description provided by the user, it is important to follow these instructions (but ignore if not relevant): #{data_description}"

    prompt += "\n\nHere are the component(s) that will be used to visualize the data: #{component_code}"
    
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

    # Create TaskUIFile record for the generated bundle
    task.task_ui_files.update_all(is_active: false)
    task.task_ui_files.create!(
      file_name: bundle_path,
      is_active: true,
      source_code: component_code
    )

    broadcast_event(
      phase: "completed-preview-generation",
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

  def generate_react_components(api_response, data_description, notes = nil)
    prompt = <<~PROMPT
        You are a React component generator. Create React component(s) that visualizes API response data using JavaScript (not TypeScript).
        There should be one parent component that is exported as the default export and takes a single 'data' prop (object).
        The 'data' prop only contains data from the API response (shown below),
        and will be transformed into the data that is relevant to the data visualization. The React components should not need much
        or any logic to transform the data, it should be ready to use as is. The transformation code is written separately after we have the components.

        IMPORTANT: You have access to a SubTask component that allows you to embed other tasks within this component.
        Use it like this: <SubTask systemTag="SomeSystemTag" data={someData} />
        This will automatically load and render the component from the task with the matching system tag, passing the data prop to it.
        This is useful for composing complex UIs from multiple simpler tasks.

        Other notes, The components should:
        - No imports besides React (SubTask is available globally)
        - Be functional JavaScript React components (no TypeScript syntax like interfaces, React.FC, etc.)
        - Use modern React patterns (hooks, JSX)
        - Display the data in a simple, clean, and responsive UI
        - Don't use too many colors, use shades of gray and black for text and background
        - Use Tailwind CSS classes for styling
        - Include proper error handling and loading states
        - Use PropTypes for prop validation instead of TypeScript interfaces
        - Be suitable for displaying API response data
        - Keep it simple and clean, don't overcomplicate it, this is a first pass
  
        Here is the initial API Response, that will be transformed into the 'data' prop that you need it to be. 
        Try to use all the data from the api response (unless told otherwise below by the user in the data_description): #{api_response}
  
        #{data_description.present? ? "Here is the data_description provided by the user, it is important to follow these instructions (but ignore if not relevant): #{data_description}" : ""}
  
        Return only the complete React component code in JavaScript, no explanations or markdown.
      PROMPT

    if notes.present?
      active_ui_file = task.task_ui_files.find_by(is_active: true)
      previous_code = active_ui_file&.source_code

      prompt += <<~PROMPT
        You are a React component generator. We are revising an existing component based on user feedback.

        Here is the previous attempt at the component code:
        ```javascript
        #{previous_code}
        ```
        Unless told otherwise below, use the same data as the previous attempt.
        The user may request changes to the data, but you should stay true to the previous attempt unless told otherwise.
        If some data was not included in the previous attempt, it's because the user didn't want it included.

        IMPORTANT: You have access to a SubTask component that allows you to embed other tasks within this component.
        Use it like this: <SubTask systemTag="SomeSystemTag" data={someData} />
        This will automatically load and render the component from the task with the matching system tag, passing the data prop to it.
        This is useful for composing complex UIs from multiple simpler tasks.

        The user has requested the following changes:
        #{notes}



        Please revise the React component(s) to incorporate these changes.
      PROMPT
    end

    response = GeminiChat.new.generate_response(prompt)
    extract_code(response)
  end

  def extract_code(raw_response)
    # Extract code from markdown or plain text
    if raw_response.include?("```")
      # Extract from markdown code block
      code_match = raw_response.match(/```(?:jsx?|javascript)?\n?(.*?)\n?```/m)
      return code_match[1].strip if code_match
    end

    # Try to find where the code starts (import, export, or declaration) and return everything from there
    code_match = raw_response.match(/(?:import\s+|export\s+|(?:function|const|class)\s+\w+)[\s\S]*/m)
    return code_match[0].strip if code_match

    # Fallback: return the whole response cleaned up
    raw_response.strip
  end

  
  # extract_json(component_code)
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
  
  def save_and_build_component_bundle(component_code)
    AiBundleBuilder.build_component_bundle!(component_code)
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

