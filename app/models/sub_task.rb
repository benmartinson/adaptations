class SubTask < ApplicationRecord
  belongs_to :task  # This is the parent task
end
