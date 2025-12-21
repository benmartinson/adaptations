class SubTask < ApplicationRecord
  belongs_to :task
  belongs_to :parent_task, class_name: "Task"
end
