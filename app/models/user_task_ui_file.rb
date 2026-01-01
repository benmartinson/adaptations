class UserTaskUiFile < ApplicationRecord
  belongs_to :template_file, class_name: "TaskUiFile"
  belongs_to :override_file, class_name: "TaskUiFile"
  belongs_to :user
end
