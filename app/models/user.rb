class User < ApplicationRecord
  has_many :user_task_ui_files, dependent: :destroy
end
