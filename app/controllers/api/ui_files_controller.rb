module Api
  class UiFilesController < ApplicationController
    skip_before_action :verify_authenticity_token

    before_action :set_task

    def index
      ui_files = @task.task_ui_files.where(is_active: true).order(created_at: :desc)
      # If user_id is provided, check for user-specific overrides
      if user_id_param.present?
        # Look up the user by their user_id field (string identifier)
        user = User.find_by(user_id: user_id_param)

        if user
          ui_files = ui_files.map do |ui_file|
            user_override = UserTaskUiFile.find_by(
              template_file_id: ui_file.id,
              user_id: user.id
            )

            if user_override
              user_override.override_file
            else
              ui_file
            end
          end
        end
      end

      render json: ui_files.map { |file| serialize_ui_file(file) }
    end

    private

    def set_task
      @task = Task.find(params[:task_id])
    end

    def user_id_param
      params[:user_id]
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
  end
end

