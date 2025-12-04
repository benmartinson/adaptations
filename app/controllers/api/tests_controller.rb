module Api
  class TestsController < ApplicationController
    skip_before_action :verify_authenticity_token

    before_action :set_task
    before_action :set_test, only: %i[run_job]

    def create
      test_data = params.require(:test).permit(:api_endpoint, :is_primary, from_response: {}, expected_output: {})

      test = @task.tests.create!(
        api_endpoint: test_data[:api_endpoint] || @task.api_endpoint,
        from_response: test_data[:from_response],
        expected_output: test_data[:expected_output],
        is_primary: test_data[:is_primary] || false,
        status: "created",
        attempts: 0
      )

      render json: serialize_test(test), status: :created
    end

    def run_job
      @test.update!(status: "pending")
      enqueue_job(@task, @test)

      render json: serialize_test(@test), status: :accepted
    end

    private

    def set_task
      @task = Task.find(params[:task_id])
    end

    def set_test
      @test = @task.tests.find(params[:id])
    end

    def enqueue_job(task, test)
      job = RunTransformTestsJob.perform_later(test.id)
      task.update!(job_id: job.job_id) if job.respond_to?(:job_id)
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
        attempts: test.attempts,
        created_at: test.created_at,
        updated_at: test.updated_at
      }
    end
  end
end

