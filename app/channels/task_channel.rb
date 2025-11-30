class TaskChannel < ApplicationCable::Channel
  def subscribed
    @task = Task.find_by(id: params[:task_id])
    reject unless @task

    stream_for(@task)
    transmit(snapshot_payload(@task).merge(phase: "snapshot"))
  end

  def unsubscribed
    stop_all_streams
  end

  private

  def snapshot_payload(task)
    {
      task_id: task.id,
      status: task.status,
      tokens: {
        prompt: task.tokens_prompt,
        completion: task.tokens_completion,
        total: task.tokens_total
      },
      metadata: task.metadata,
      input_payload: task.input_payload,
      output_payload: task.output_payload,
      created_at: task.created_at,
      updated_at: task.updated_at
    }
  end
end

