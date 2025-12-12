class GenerateLinkPreviewJob < ApplicationJob
  queue_as :default

  rescue_from(ActiveRecord::RecordNotFound) do |_error|
    Rails.logger.warn("[GenerateLinkPreviewJob] Task not found, skipping job")
  end
  rescue_from(StandardError) do |error|
    handle_failure(error)
  end

  def perform(task_id)
    @task = Task.find(task_id)
    run_link_preview_generation
  end

  private

  attr_reader :task

  def run_link_preview_generation
    task.update!(error_message: nil)
    broadcast_event(
      phase: "preview_generation",
      message: "Generating link preview",
      progress: 0.1,
      error_message: nil
    )

    from_task = Task.where(kind: "api_transform").find_by(system_tag: task.system_tag)
    to_task = Task.where(kind: "api_transform").find_by(system_tag: task.to_system_tag)

    unless from_task && to_task
      raise StandardError, "Could not find connected tasks for link preview"
    end

    unless from_task.api_endpoint.present?
      raise StandardError, "No api_endpoint found in from_task (#{task.system_tag})"
    end

    begin
      from_data = fetch_endpoint_data(from_task.api_endpoint)
      first_output = execute_transform(from_task.transform_code, from_data)
      second_output = execute_transform(task.transform_code, first_output)
      to_endpoint = second_output.to_s.strip
      if to_endpoint.blank?
        raise StandardError, "Link transformation did not produce a valid endpoint"
      end

      to_data = fetch_endpoint_data(to_endpoint)
      final_output = execute_transform(to_task.transform_code, [to_data])

      task.update!(output_payload: { preview_response: final_output })

      broadcast_event(
        phase: "completed",
        message: "Link preview generated successfully",
        output_payload: { preview_response: final_output },
        final: true
      )
    rescue StandardError => e
      task.update!(error_message: e.message)
      broadcast_event(
        phase: "error",
        message: e.message,
        final: true,
        error_message: e.message
      )
    end
  end

  def execute_transform(code_body, input)
    return input if code_body.blank?

    begin
      # Try using RubySandbox first
      RubySandbox.run(code_body, input)
    rescue StandardError
      # Fallback to inline evaluation
      evaluate_inline(code_body, input)
    end
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
