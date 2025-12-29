module Api
  class TasksController < ApplicationController
    skip_before_action :verify_authenticity_token

    before_action :set_task, only: %i[show update destroy run_job run_tests ui_files sub_tasks create_sub_task update_sub_task generate_subtask_ui delete_sub_task]
    before_action :set_sub_task, only: %i[update_sub_task generate_subtask_ui delete_sub_task]

    def index
      tasks = Task.recent.limit(limit_param)
      render json: tasks.map { |task| serialize_task(task) }
    end

    def system_tags
      tags = Task.where.not(system_tag: [nil, ""]).distinct.pluck(:system_tag).sort
      render json: tags
    end

    def by_system_tag
      system_tag = params[:system_tag]
      task = Task.find_by(system_tag: system_tag)

      if task
        render json: serialize_task(task)
      else
        render json: { error: "Task not found with system_tag: #{system_tag}" }, status: :not_found
      end
    end

    def show
      render json: serialize_task(@task)
    end

    def create
      task = Task.create!(task_params)

      render json: serialize_task(task), status: :created
    end

    def update
      @task.update!(task_params)

      render json: serialize_task(@task)
    end

    def destroy
      @task.destroy!
      head :no_content
    end

    def run_job
      @task.update!(run_job_params)
      enqueue_job(@task)

      render json: serialize_task(@task), status: :accepted
    end

    def run_tests
      test_ids = @task.tests.pluck(:id)
      Test.where(id: test_ids).update_all(status: "pending")
      if test_ids.empty?
        render json: { error: "No tests found for this task" }, status: :unprocessable_entity
        return
      end

      if @task.kind == "link"
        job = RunLinkTransformTestsJob.perform_later(test_ids)
      else
        job = RunTransformTestsJob.perform_later(test_ids)
      end
      @task.update!(job_id: job.job_id) if job.respond_to?(:job_id)

      render json: serialize_task(@task), status: :accepted
    end

    def ui_files
      ui_files = @task.task_ui_files.where(is_active: true).order(created_at: :desc)
      render json: ui_files.map { |file| serialize_ui_file(file) }
    end

    def sub_tasks
      render json: @task.sub_tasks.map { |sub_task| serialize_sub_task(sub_task) }
    end

    def create_sub_task
      sub_task_params = params.require(:sub_task).permit(:system_tag, :parent_system_tag, :notes, :endpoint_notes)

      # Create SubTask - task_id is the parent task (@task)
      sub_task = @task.sub_tasks.create!(
        system_tag: sub_task_params[:system_tag],
        parent_system_tag: sub_task_params[:parent_system_tag],
        notes: sub_task_params[:notes],
        endpoint_notes: sub_task_params[:endpoint_notes]
      )

      render json: serialize_sub_task(sub_task), status: :created
    end

    def update_sub_task
      sub_task_params = params.require(:sub_task).permit(:notes, :endpoint_notes)
      @sub_task.update!(sub_task_params)

      render json: serialize_sub_task(@sub_task)
    end

    def generate_subtask_ui
      is_delete = params[:is_delete] == true || params[:is_delete] == "true"

      unless is_delete
        sub_task_params = params.require(:sub_task).permit(:notes, :endpoint_notes)
        @sub_task.update!(sub_task_params)
      end

      # Trigger UI generation for the parent task to include/update/remove the sub-task
      job = SubtaskUiGenerationJob.perform_later(@sub_task.id, is_delete: is_delete)
      @task.update!(job_id: job.job_id) if job.respond_to?(:job_id)

      render json: serialize_sub_task(@sub_task), status: :accepted
    end

    def delete_sub_task
      @sub_task.destroy!
      head :no_content
    end

    private

    def set_task
      @task = Task.find(params[:id])
    end

    def set_sub_task
      @sub_task = @task.sub_tasks.find(params[:sub_task_id])
    end

    def limit_param
      [[params.fetch(:limit, 25).to_i, 1].max, 100].min
    end

    def task_params
      payload = params.require(:task).permit(:kind, :api_endpoint, :system_tag, :to_system_tag, :data_description, :element_type, metadata: {}, input_payload: {}, output_payload: {})

      result = {}
      result[:kind] = payload[:kind] if payload[:kind].present?
      result[:api_endpoint] = payload[:api_endpoint] if payload.key?(:api_endpoint)
      result[:system_tag] = payload[:system_tag] if payload.key?(:system_tag)
      result[:to_system_tag] = payload[:to_system_tag] if payload.key?(:to_system_tag)
      result[:data_description] = payload[:data_description] if payload.key?(:data_description)
      result[:element_type] = payload[:element_type] if payload.key?(:element_type)
      result[:metadata] = payload[:metadata] if payload[:metadata].present?
      result[:input_payload] = payload[:input_payload] if payload[:input_payload].present?
      result[:output_payload] = payload[:output_payload] if payload[:output_payload].present?

      # Handle response_json which can be either a string or a hash
      if params[:task].key?(:response_json)
        result[:response_json] = params[:task][:response_json]
      end

      result
    end

    def run_job_params
      payload = params.require(:task).permit(:api_endpoint, :system_tag, :to_system_tag, :data_description, :element_type, metadata: {}, input_payload: {})

      result = {}
      result[:api_endpoint] = payload[:api_endpoint] if payload.key?(:api_endpoint)
      result[:system_tag] = payload[:system_tag] if payload.key?(:system_tag)
      result[:to_system_tag] = payload[:to_system_tag] if payload.key?(:to_system_tag)
      result[:data_description] = payload[:data_description] if payload.key?(:data_description)
      result[:element_type] = payload[:element_type] if payload.key?(:element_type)
      result[:metadata] = payload[:metadata] if payload[:metadata].present?
      result[:input_payload] = payload[:input_payload] if payload[:input_payload].present?
      result
    end

    def serialize_task(task)
      {
        id: task.id,
        kind: task.kind,
        status: task.status,
        api_endpoint: task.api_endpoint,
        system_tag: task.system_tag,
        to_system_tag: task.to_system_tag,
        data_description: task.data_description,
        element_type: task.element_type,
        response_json: task.response_json,
        transform_code: task.transform_code,
        started_at: task.started_at,
        finished_at: task.finished_at,
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
        tests: task.tests.order(created_at: :desc).map { |t| serialize_test(t) },
        created_at: task.created_at,
        updated_at: task.updated_at
      }
    end

    def serialize_test(test)
      {
        id: test.id,
        api_endpoint: test.api_endpoint,
        status: test.status,
        from_response: test.from_response,
        expected_output: test.expected_output,
        actual_output: test.actual_output,
        error_message: test.error_message,
        is_primary: test.is_primary,
        description: test.description,
        notes: test.notes,
        test_type: test.test_type,
        attempts: test.attempts,
        created_at: test.created_at,
        updated_at: test.updated_at
      }
    end

    def serialize_ui_file(ui_file)
      {
        id: ui_file.id,
        file_name: ui_file.file_name,
        is_active: ui_file.is_active,
        created_at: ui_file.created_at,
        updated_at: ui_file.updated_at
      }
    end

    def serialize_sub_task(sub_task)
      associated_task = Task.find_by(system_tag: sub_task.system_tag)
      {
        id: sub_task.id,
        task_id: sub_task.task_id,  # Parent task ID
        system_tag: sub_task.system_tag,
        parent_system_tag: sub_task.parent_system_tag,
        notes: sub_task.notes,
        endpoint_notes: sub_task.endpoint_notes,
        element_type: associated_task&.element_type,
        created_at: sub_task.created_at,
        updated_at: sub_task.updated_at
      }
    end

    def enqueue_job(task)
      task_type = task.input_payload.fetch("task_type", nil)

      job = case task_type
            when "preview_response_generation"
              PreviewResponseGenerationJob.perform_later(task.id, task.input_payload.fetch("notes", nil))
            when "transform_code_generation"
              TransformCodeGenerationJob.perform_later(task.id)
            else
              nil
            end

      task.update!(job_id: job.job_id) if job&.respond_to?(:job_id)
    end
  end
end
