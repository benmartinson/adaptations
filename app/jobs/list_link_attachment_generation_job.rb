require 'fileutils'

class ListLinkAttachmentGenerationJob < ApplicationJob
  queue_as :default

  rescue_from(ActiveRecord::RecordNotFound) do |_error|
    Rails.logger.warn("[ListLinkAttachmentGenerationJob] Task not found, skipping job")
  end
  rescue_from(StandardError) do |error|
    handle_failure(error)
  end

  def perform(task_id)
    @task = Task.find(task_id)
    run_link_attachment_generation
  end

  private

  attr_reader :task

  def run_link_attachment_generation
    broadcast_event(
      phase: "link_attachment_generation",
      message: "Attaching links to UI components...",
      progress: 0.1
    )

    active_ui_file = task.task_ui_files.find_by(is_active: true)
    existing_code = active_ui_file&.source_code

    if existing_code.blank?
      raise StandardError, "Task has no active UI file to modify."
    end

    # Fetch the active list_link_connector task for this task's system_tag
    active_link_connector = Task.find_by(
      kind: "list_link_connector",
      system_tag: task.system_tag,
      is_active: true
    )

    if active_link_connector.nil?
      raise StandardError, "No active list link connector found. Please select an active link connection first."
    end

    if active_link_connector.to_system_tag.blank? || active_link_connector.transform_code.blank?
      raise StandardError, "Active link connector is not fully configured. Please configure the target system tag and transform code."
    end

    prompt = build_prompt(existing_code, active_link_connector)
    updated_code = generate_code_response(prompt)
    bundle_path = save_and_build_component_bundle(updated_code)

    # Delete old task_ui_files and their associated files, then create a new one
    cleanup_task_ui_files(task)

    task.task_ui_files.create!(
      file_name: bundle_path,
      is_active: true,
      source_code: updated_code
    )

    broadcast_event(
      phase: "completed-link-attachment",
      message: "Links attached successfully",
      response_json: task.response_json,
      system_tag: task.system_tag,
      final: true
    )
  end

  def build_prompt(existing_code, active_connector)
    <<~PROMPT
      You are helping to add clickable links to an existing React component that displays a list of items.

      Here is the existing React component code:
      ```javascript
      #{existing_code}
      ```

      We want to add navigation links to items in this list using the `<DynamicLink>` component.
      
      The DynamicLink component is a globally available component with the following API:
      - `systemTag` (required): The system tag of the target task to navigate to
      - `apiEndpoint` (required): The API endpoint URL. You get it from item.api_endpoint_link, which is included in the item data.
      - `children`: The content to render inside the link (usually the item data, all of it)

      Example usage:
      ```jsx
      <DynamicLink 
        systemTag=#{active_connector.to_system_tag} 
        apiEndpoint={item.api_endpoint_link}
      >
        <div>
        {item.title}
        ...all other item data...
        ...should be rendered inside the link...
        </div>
      </DynamicLink>
      ```

      IMPORTANT INSTRUCTIONS:
      1. Wrap each item in the list with DynamicLink. Do not wrap the entire list with DynamicLink, wrap each item individually.
      2. The systemTag prop should be the string shown in the example: systemTag=#{active_connector.to_system_tag}. You are not allowed to change this.
      3. The apiEndpoint prop should be the string shown in the example: apiEndpoint={item.api_endpoint_link}, you are not allowed to change this.
      4. The item.api_endpoint_link variable is included in the item data (derived from the data prop), you are not creating this variable, you are using it as is.
      5. Keep all existing functionality, styles, and logic exactly the same.
      6. The DynamicLink component should wrap the entire item data, not just a specific element.
      7. If an element is already wrapped in a link or DynamicLink, update it rather than double-wrapping.
      8. Return the complete updated React component code.
      9. Do not include any explanations, only the code.
    PROMPT
  end

  def generate_code_response(prompt)
    response = GeminiChat.new.generate_response(prompt)
    extract_code(response)
  end

  def save_and_build_component_bundle(component_code)
    AiBundleBuilder.build_component_bundle!(component_code)
  end

  def handle_failure(error)
    return unless task

    broadcast_event(
      phase: "error",
      message: error.message,
      final: true
    )
  end
end

