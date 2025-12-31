module Api
  class AppsController < ApplicationController
    skip_before_action :verify_authenticity_token

    # GET /api/apps
    def index
      apps = App.all.order(created_at: :desc)
      render json: apps
    end

    # POST /api/apps
    def create
      app = App.new(app_params)
      if app.save
        render json: app, status: :created
      else
        render json: { errors: app.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # DELETE /api/apps/:id
    def destroy
      app = App.find(params[:id])
      app.destroy
      head :no_content
    rescue ActiveRecord::RecordNotFound
      render json: { error: "App not found" }, status: :not_found
    end

    # POST /api/apps/run
    # Runs TransformProcess with the given system_tag and api_endpoint
    # Returns the transformed data along with the task_id for UI rendering
    def run
      system_tag = params[:system_tag]
      api_endpoint = params[:api_endpoint]

      if system_tag.blank?
        render json: { error: "system_tag is required" }, status: :unprocessable_entity
        return
      end

      if api_endpoint.blank?
        render json: { error: "api_endpoint is required" }, status: :unprocessable_entity
        return
      end

      begin
        result = TransformProcess.new(
          system_tag: system_tag,
          api_endpoint: api_endpoint,
          log_tests: false
        ).call

        task = Task.find_by!(system_tag: system_tag)

        render json: {
          task_id: task.id,
          system_tag: system_tag,
          data: result
        }
      rescue TransformProcess::NotFoundError => e
        render json: { error: e.message }, status: :not_found
      rescue TransformProcess::TransformError => e
        render json: { error: e.message }, status: :unprocessable_entity
      rescue StandardError => e
        Rails.logger.error("[AppsController#run] Unexpected error: #{e.message}")
        render json: { error: "An unexpected error occurred" }, status: :internal_server_error
      end
    end

    private

    def app_params
      params.require(:app).permit(:name, :description)
    end
  end
end

