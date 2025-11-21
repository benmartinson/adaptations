module Api
  class TasksController < ApplicationController
    skip_before_action :verify_authenticity_token

    before_action :set_task, only: %i[show cancel]

    def index
      tasks = Task.recent.limit(limit_param)
      render json: tasks.map { |task| serialize_task(task) }
    end

    def show
      render json: serialize_task(@task)
    end

    def create
      task = Task.create!(task_params)
      enqueue_job(task)

      render json: serialize_task(task), status: :accepted
    end

    def cancel
      @task.request_cancel!(reason: cancel_reason)
      render json: serialize_task(@task)
    end

    private

    def set_task
      @task = Task.find(params[:id])
    end

    def limit_param
      [[params.fetch(:limit, 25).to_i, 1].max, 100].min
    end

    def task_params
      payload = params.require(:task).permit(:kind, :api_endpoint, :system_tag, :data_description, metadata: {}, input_payload: {})

      {
        kind: payload[:kind].presence || "code_workflow",
        api_endpoint: payload[:api_endpoint],
        system_tag: payload[:system_tag],
        data_description: payload[:data_description],
        metadata: payload[:metadata] || {},
        input_payload: payload[:input_payload] || {}
      }
    end

    def cancel_reason
      params.fetch(:reason, nil)
    end

    def serialize_task(task)
      {
        id: task.id,
        kind: task.kind,
        status: task.status,
        api_endpoint: task.api_endpoint,
        system_tag: task.system_tag,
        data_description: task.data_description,
        response_json: task.response_json,
        started_at: task.started_at,
        finished_at: task.finished_at,
        cancelled_at: task.cancelled_at,
        last_progress_at: task.last_progress_at,
        tokens: {
          prompt: task.tokens_prompt,
          completion: task.tokens_completion,
          total: task.tokens_total
        },
        metadata: task.metadata,
        input_payload: task.input_payload,
        output_payload: task.output_payload,
        error_message: task.error_message,
        job_id: task.job_id,
        created_at: task.created_at,
        updated_at: task.updated_at
      }
    end

    def enqueue_job(task)
      job_class = "CodeWorkflowJob".safe_constantize
      job = job_class.perform_later(task.id)
      task.update!(job_id: job.job_id) if job.respond_to?(:job_id)
    end
  end
end

