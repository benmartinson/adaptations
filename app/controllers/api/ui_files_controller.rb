module Api
  class UiFilesController < ApplicationController
    skip_before_action :verify_authenticity_token

    before_action :set_task

    def index
      template_files = @task.task_ui_files.where(is_template: true).order(created_at: :desc)
      ui_files = template_files

      # If user_id is provided, check for user-specific overrides
      if user_id_param.present?
        # Look up the user by their user_id field (string identifier)
        user = User.find(user_id_param)
        if user
          override_files = UserTaskUiFile.where(user_id: user.id).includes(:override_file, :template_file)
          ui_files = template_files.map do |template_file|
            user_override = UserTaskUiFile.find_by(
              template_file_id: template_file.id,
              user_id: user.id
            )

            if user_override
              TaskUiFile.find(user_override.override_file_id)
            else
              template_file
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
        is_template: ui_file.is_template,
        created_at: ui_file.created_at,
        updated_at: ui_file.updated_at
      }
    end
  end
end

