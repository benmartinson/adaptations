class TaskUiFile < ApplicationRecord
  belongs_to :task

  # User overrides: this file can be a template (original) or an override (user-customized)
  has_many :template_user_files, class_name: "UserTaskUiFile", foreign_key: "template_file_id", dependent: :destroy
  has_many :override_user_files, class_name: "UserTaskUiFile", foreign_key: "override_file_id", dependent: :destroy
end
