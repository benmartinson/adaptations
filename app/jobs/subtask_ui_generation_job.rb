require 'fileutils'

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
    @parent_task = subtask.task  # task is the parent task
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
      You are helping to mix a child component into an existing React component.

      Here is the existing React component code:
      ```javascript
      #{existing_code}
      ```

      We want to add a new child component using the `<SubTask />` component.
      The user has provided details about where in the interface should the child component be placed: 
      #{subtask.notes}

      IMPORTANT: 
      - Use the `<SubTask systemTag="#{subtask.system_tag}" data={data.#{subtask.system_tag}} />` component.
      - The `data` prop will include this attribute: #{subtask.system_tag} which is the data needed by the SubTask component.
      - You should only add the necessary lines of code to integrate this `<SubTask />` component.
      - Keep all existing functionality, styles, and logic exactly the same.
      - Return the complete updated React component code.
      - Do not include any explanations, only the code.
    PROMPT

    updated_code = generate_code_response(prompt)
    bundle_path = save_and_build_component_bundle(updated_code)

    # Delete old task_ui_files and their associated files, then create a new one
    parent_task.task_ui_files.each do |ui_file|
      begin
        if ui_file.file_name.present?
          # Delete the final bundle file in public/ai_bundles
          # Strip leading slash since file_name is like "/ai_bundles/task-preview-XXX.js"
          full_bundle_path = Rails.root.join("public", ui_file.file_name.sub(/^\//, ""))
          FileUtils.rm_f(full_bundle_path)

          # Clean up source files in app/javascript/ai_bundles
          # The source files use a hash of the source_code, so we can compute it
          if ui_file.source_code.present?
            source_hash = Digest::MD5.hexdigest(ui_file.source_code)[0..7]
            # Delete matching source files (task_preview_*_{hash}.jsx and task-preview_entry_*_{hash}.jsx)
            Dir.glob(Rails.root.join("app", "javascript", "ai_bundles", "*_#{source_hash}.jsx")).each do |temp_file|
              FileUtils.rm_f(temp_file)
            end
          end
        end
      rescue => e
        Rails.logger.warn("[SubtaskUiGenerationJob] Failed to delete file #{ui_file.file_name}: #{e.message}")
      end
      ui_file.destroy!
    end

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

