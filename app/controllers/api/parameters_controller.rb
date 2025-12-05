module Api
  class ParametersController < ApplicationController
    skip_before_action :verify_authenticity_token

    before_action :set_task
    before_action :set_parameter, only: %i[show update destroy]

    def index
      render json: @task.parameters.map { |p| serialize_parameter(p) }
    end

    def show
      render json: serialize_parameter(@parameter)
    end

    def create
      parameter_data = params.require(:parameter).permit(:name, :example_value)

      parameter = @task.parameters.create!(
        name: parameter_data[:name],
        example_value: parameter_data[:example_value]
      )

      render json: serialize_parameter(parameter), status: :created
    end

    def update
      parameter_data = params.require(:parameter).permit(:name, :example_value)
      
      # Validate that example_value is included in the API endpoint
      if parameter_data[:example_value].present? && @task.api_endpoint.present?
        unless @task.api_endpoint.include?(parameter_data[:example_value])
          render json: { error: "Example value must be included in the API endpoint" }, status: :unprocessable_entity
          return
        end
      end
      
      @parameter.update!(parameter_data)

      render json: serialize_parameter(@parameter)
    end

    def destroy
      @parameter.destroy!
      head :no_content
    end

    private

    def set_task
      @task = Task.find(params[:task_id])
    end

    def set_parameter
      @parameter = @task.parameters.find(params[:id])
    end

    def serialize_parameter(parameter)
      {
        id: parameter.id,
        name: parameter.name,
        example_value: parameter.example_value,
        task_id: parameter.task_id,
        created_at: parameter.created_at,
        updated_at: parameter.updated_at
      }
    end
  end
end

