require 'fileutils'

class PreviewResponseGenerationJob < ApplicationJob
  queue_as :default

  ELEMENT_NAME_TO_COMPONENT_NAME = {
    'horizontal' => 'HorizontalCardList',
    'vertical' => 'VerticalCardList',
    'list' => 'HorizontalCardList',  # Backward compatibility
    'detail' => 'DetailPage',
    'generated' => 'GeneratedPage'
  }.freeze

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
    element_type = task.input_payload.fetch("element_type", "generated")

    # Get the component name for this element type
    component_name = ELEMENT_NAME_TO_COMPONENT_NAME[element_type] || 'GeneratedPage'

    # Generate React components for data visualization based on element type
    if element_type != "generated" && !notes.present?
      component_code = get_component(component_name)
      bundle_path = save_and_build_component_bundle(component_code)
    else
      component_code = generate_react_components(from_response, data_description, notes)
      bundle_path = save_and_build_component_bundle(component_code)
    end

    if ['horizontal', 'vertical', 'list'].include?(element_type)
      prompt = build_card_list_transform_prompt(from_response, data_description, component_code, component_name)
    else
      prompt = build_default_transform_prompt(from_response, data_description, component_code)
    end
    
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
    # Delete old task_ui_files and their associated files
    cleanup_task_ui_files(task)

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
    if !notes.present?
    prompt = <<~PROMPT
        Take a look at this api response data: #{api_response}

        Create one parent React component that accepts a single 'data' prop (object) and visualizes the data.
        The component should be exported as the default export and takes a single 'data' prop (object).
        The 'data' prop contains the transformed API response data ready to use in the component.
        But you should keep it simple and assume the data prop is similar to the api response data.

        Available global components:
        #{iframe_components_documentation}

        - Important notes:
        - Be functional JavaScript React components (no TypeScript syntax like interfaces, React.FC, etc.)
        - Use modern React patterns (hooks, JSX)
        - Display the data in a simple, clean, and responsive UI
        - Don't use too many colors, use shades of gray and black for text and background
        - Use Tailwind CSS classes for styling
        - Use PropTypes for prop validation instead of TypeScript interfaces
        - Be suitable for displaying API response data
        - Keep it simple and clean, don't overcomplicate it, this is a first pass
        - Do not check for error states, no loading states, no error messages, no nothing. Just display the data. You will always be given the data to display.
        - No linking to other pages, no routing, no navigation, no nothing. Just display the data. Unless told otherwise by the user in the data_description.
        - Don't duplicate lists or data that is already displayed.
        - Try to use the global components to display the data, but you can create a custom component if needed.

        Return only the complete React component code in JavaScript, no explanations or markdown.
  
        Try to use all the data from the api response (unless told otherwise below by the user in the data_description):
        #{data_description.present? ? "Here is the data_description provided by the user, it is important to follow these instructions (but ignore if not relevant): #{data_description}" : ""}
  
        Return only the complete React component code in JavaScript, no explanations or markdown.
      PROMPT

    else
      active_ui_file = task.task_ui_files.find_by(is_active: true)
      previous_code = active_ui_file&.source_code

      prompt = <<~PROMPT
        We are revising an existing component based on user feedback.

        Previously, you created a parent React component that accepts a single 'data' prop (object) and visualizes the data.
        Here is the previous attempt at the component code:
        ```javascript
        #{previous_code}
        ```
        Unless told otherwise below, use the same data prop object structure as the previous attempt.
        The user may request changes to the data, but you should stay true to the previous attempt unless told otherwise.
        You can add some logic to the component to transform the data if requested, like sorting, filtering, etc.
        But don't add too much logic, keep it simple and clean. Don't change the data values itself.
        The user has requested the following changes:
        #{notes}

        Please revise the React component(s) to incorporate these changes.
        Return only the complete React component code in JavaScript, no explanations or markdown. 
      PROMPT
    end

    response = GeminiChat.new.generate_response(prompt)
    extract_code(response)
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

  def iframe_components_documentation
    doc_path = Rails.root.join("app", "javascript", "iframe_components", "prompt_documentation.txt")
    return "" unless File.exist?(doc_path)
    
    File.read(doc_path)
  end

  def component_documentation(component_name)
    doc_path = Rails.root.join("app", "javascript", "iframe_components", "prompt_documentation.txt")
    return "" unless File.exist?(doc_path)

    doc_content = File.read(doc_path)
    # Find the component section by looking for "- ComponentName:" pattern
    component_pattern = /^- #{Regexp.escape(component_name)}: (.+?)(?=\n\n|^- |\z)/m
    match = doc_content.match(component_pattern)
    return "" unless match

    "- #{component_name}: #{match[1]}"
  end

  def get_component(component_name)
    component_path = Rails.root.join("app", "javascript", "iframe_components", "#{component_name}.jsx")
    return "" unless File.exist?(component_path)

    File.read(component_path)
  end

  def build_card_list_transform_prompt(from_response, data_description, component_code, component_name)
    component_docs = component_documentation(component_name)

    <<~PROMPT
      You are an assistant that helps transform API response data for a #{component_name} component.

      #{component_docs}

      Here is the API response data that needs to be transformed:
      #{from_response}

      Transform this API response into the format expected by the #{component_name} component.
      Map relevant fields from the API response to the item properties as described in the component documentation.

      #{data_description.present? ? "User instructions for the data transformation: #{data_description}" : ""}

      Return only the JSON object, no other text or comments.
    PROMPT
  end

  def build_default_transform_prompt(from_response, data_description, component_code)
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
    
    prompt
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

