class SubtaskUiGenerationJob < ApplicationJob
  queue_as :default

  rescue_from(ActiveRecord::RecordNotFound) do |_error|
    Rails.logger.warn("[SubtaskUiGenerationJob] SubTask not found, skipping job")
  end
  rescue_from(StandardError) do |error|
    handle_failure(error)
  end

  def perform(subtask_id)
    @subtask = SubTask.find(subtask_id)
    @parent_task = subtask.parent_task
    @task = @parent_task # For broadcast_event compatibility
    run_subtask_ui_generation
  end

  private

  attr_reader :subtask, :parent_task, :task

  def run_subtask_ui_generation
    broadcast_event(
      phase: "preview_generation",
      message: "Adding sub-process to UI...",
      progress: 0.1
    )

    active_ui_file = parent_task.task_ui_files.find_by(is_active: true)
    existing_code = active_ui_file&.source_code

    if existing_code.blank?
      raise StandardError, "Parent task has no active UI file to modify."
    end

    prompt = <<~PROMPT
      You are a React component generator. You are helping to mix a child process (SubTask) into an existing React component.

      Here is the existing React component code:
      ```javascript
      #{existing_code}
      ```

      We want to add a new child process using the `<SubTask />` component.
      
      Details for the child process:
      - System Tag: #{subtask.system_tag}
      - Placement Notes: #{subtask.notes}
      - API Construction Notes: #{subtask.endpoint_notes}

      IMPORTANT: 
      - Use the `<SubTask systemTag="#{subtask.system_tag}" data={someData} />` component.
      - The `data` prop should be constructed based on the "API Construction Notes" provided above.
      - You should only add the necessary lines of code to integrate this `<SubTask />` component.
      - Keep all existing functionality, styles, and logic exactly the same.
      - Return the complete updated React component code.
      - Do not include any explanations, only the code.
    PROMPT

    updated_code = generate_code_response(prompt)
    bundle_path = save_and_build_component_bundle(updated_code)

    # Deactivate existing UI files and create a new one
    parent_task.task_ui_files.update_all(is_active: false)
    parent_task.task_ui_files.create!(
      file_name: bundle_path,
      is_active: true,
      source_code: updated_code
    )

    broadcast_event(
      phase: "completed-preview-generation",
      message: "Sub-process added successfully",
      response_json: parent_task.response_json,
      system_tag: parent_task.system_tag,
      final: true
    )
  end

  def generate_code_response(prompt)
    response = GeminiChat.new.generate_response(prompt)
    extract_code(response)
  end

  def extract_code(raw_response)
    if raw_response.include?("```")
      code_match = raw_response.match(/```(?:jsx?|javascript)?\n?(.*?)\n?```/m)
      return code_match[1].strip if code_match
    end

    code_match = raw_response.match(/(?:import\s+|export\s+|(?:function|const|class)\s+\w+)[\s\S]*/m)
    return code_match[0].strip if code_match

    raw_response.strip
  end

  def save_and_build_component_bundle(component_code)
    AiBundleBuilder.build_component_bundle!(component_code)
  end

  def broadcast_event(data)
    channel_class = "TaskChannel".safe_constantize
    payload = {
      task_id: task.id,
      status: task.status,
      timestamp: Time.current.iso8601
    }.merge(data)

    channel_class&.broadcast_to(task, payload)
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

