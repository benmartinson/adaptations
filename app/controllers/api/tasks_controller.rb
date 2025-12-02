module Api
  class TasksController < ApplicationController
    skip_before_action :verify_authenticity_token

    before_action :set_task, only: %i[show update run_job]

    def index
      tasks = Task.recent.limit(limit_param)
      render json: tasks.map { |task| serialize_task(task) }
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

    def run_job
      @task.update!(run_job_params)
      test = create_test_if_needed
      enqueue_job(@task, test)

      render json: serialize_task(@task), status: :accepted
    end

    private

    def set_task
      @task = Task.find(params[:id])
    end

    def limit_param
      [[params.fetch(:limit, 25).to_i, 1].max, 100].min
    end

    def task_params
      payload = params.require(:task).permit(:kind, :api_endpoint, :system_tag, :data_description, metadata: {}, input_payload: {}, response_json: {})

      result = {}
      result[:kind] = payload[:kind] if payload[:kind].present?
      result[:api_endpoint] = payload[:api_endpoint] if payload.key?(:api_endpoint)
      result[:system_tag] = payload[:system_tag] if payload.key?(:system_tag)
      result[:data_description] = payload[:data_description] if payload.key?(:data_description)
      result[:metadata] = payload[:metadata] if payload[:metadata].present?
      result[:input_payload] = payload[:input_payload] if payload[:input_payload].present?
      result[:response_json] = payload[:response_json] if payload[:response_json].present?
      result
    end

    def run_job_params
      payload = params.require(:task).permit(:api_endpoint, :system_tag, :data_description, metadata: {}, input_payload: {})

      result = {}
      result[:api_endpoint] = payload[:api_endpoint] if payload.key?(:api_endpoint)
      result[:system_tag] = payload[:system_tag] if payload.key?(:system_tag)
      result[:data_description] = payload[:data_description] if payload.key?(:data_description)
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
        data_description: task.data_description,
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
        attempts: test.attempts,
        created_at: test.created_at,
        updated_at: test.updated_at
      }
    end

    def create_test_if_needed
      task_type = @task.input_payload.fetch("task_type", nil)
      return nil unless task_type == "run_transform_tests" && params[:test].present?

      test_data = params.require(:test).permit(:api_endpoint, from_response: {}, expected_output: {})
      
      @task.tests.create!(
        api_endpoint: test_data[:api_endpoint] || @task.api_endpoint,
        from_response: test_data[:from_response],
        expected_output: test_data[:expected_output] || @task.response_json,
        status: "pending",
        attempts: 0
      )
    end

    def enqueue_job(task, test = nil)
      task_type = task.input_payload.fetch("task_type", nil)
      
      job_class = case task_type
                  when "preview_response_generation"
                    "PreviewResponseGenerationJob"
                  when "generate_transform_code"
                    "GenerateTransformCodeJob"
                  when "run_transform_tests"
                    "RunTransformTestsJob"
                  else
                    # Default fallback
                    "PreviewResponseGenerationJob"
                  end
      
      job_class_constant = job_class.safe_constantize
      job = if test
              job_class_constant.perform_later(task.id, test.id)
            else
              job_class_constant.perform_later(task.id)
            end
      task.update!(job_id: job.job_id) if job.respond_to?(:job_id)
    end
  end
end

