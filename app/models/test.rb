class Test < ApplicationRecord
  belongs_to :task

  enum :status, {
    created: "created",
    pending: "pending",
    pass: "pass",
    fail: "fail",
    error: "error"
  }, default: "created"
end
