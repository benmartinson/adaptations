require 'fileutils'

class SubtaskUiGenerationJob < ApplicationJob
  queue_as :default

  rescue_from(ActiveRecord::RecordNotFound) do |_error|
    Rails.logger.warn("[SubtaskUiGenerationJob] SubTask not found, skipping job")
  end
  rescue_from(StandardError) do |error|
    handle_failure(error)
  end

  def perform(subtask_id, is_delete: false)
    @subtask = SubTask.find(subtask_id)
    @parent_task = subtask.task  # task is the parent task
    @task = @parent_task # For broadcast_event compatibility
    @is_delete = is_delete
    run_subtask_ui_generation
  end

  private

  attr_reader :subtask, :parent_task, :task, :is_delete

  def run_subtask_ui_generation
    broadcast_event(
      phase: "subtask_ui_generation",
      subtask_id: subtask.id,
      message: is_delete ? "Removing sub-process from UI..." : "Adding sub-process to UI...",
      progress: 0.1
    )

    active_ui_file = parent_task.task_ui_files.find_by(is_active: true)
    existing_code = active_ui_file&.source_code

    if existing_code.blank?
      raise StandardError, "Parent task has no active UI file to modify."
    end

    if is_delete
      prompt = <<~PROMPT
        You are helping to remove a child component from an existing React component.

        Here is the existing React component code:
        ```javascript
        #{existing_code}
        ```

        We want to remove the `<SubTask />` component with id={#{subtask.id}}.
        Find and remove any `<SubTask id={#{subtask.id}} />` components from the code.

        IMPORTANT:
        - Remove only the SubTask component with id={#{subtask.id}}
        - Leave all other SubTask components with different ids intact
        - Keep all existing functionality, styles, and logic exactly the same
        - Return the complete updated React component code
        - Do not include any explanations, only the code
      PROMPT
    else
      prompt = <<~PROMPT
        You are helping to mix a child component into an existing React component.

        Here is the existing React component code:
        ```javascript
        #{existing_code}
        ```

        We want to add a new child component using the `<SubTask />` component.
        The user has provided details about where in the interface should the child component be placed:
        #{subtask.notes}

        IMPORTANT:
        - Use the `<SubTask systemTag="#{subtask.system_tag}" data={data.#{subtask.system_tag}} id={#{subtask.id}} />` component.
        - The `id` prop is the id of the subtask. The current id is #{subtask.id}.
          If there is already a subtask with the same id, you should remove the existing subtask and add the new one.
          Leave the existing subtasks with different ids in the code. There could be multiple subtasks with the same system_tag but different ids.
        - The `data` prop will include this attribute: #{subtask.system_tag} which is the data needed by the SubTask component.
        - You should only add the necessary lines of code to integrate this `<SubTask />` component.
        - Keep all existing functionality, styles, and logic exactly the same.
        - Return the complete updated React component code.
        - Do not include any explanations, only the code.
      PROMPT
    end

    updated_code = generate_code_response(prompt)
    bundle_path = save_and_build_component_bundle(updated_code)

    # Delete old task_ui_files and their associated files, then create a new one
    cleanup_task_ui_files(parent_task)

    parent_task.task_ui_files.create!(
      file_name: bundle_path,
      is_active: true,
      source_code: updated_code
    )

    broadcast_event(
      phase: "completed-subtask-ui-generation",
      message: is_delete ? "Sub-process removed successfully" : "Sub-process added successfully",
      subtask_id: subtask.id,
      response_json: parent_task.response_json,
      system_tag: parent_task.system_tag,
      final: true
    )
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

