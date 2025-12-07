class Test < ApplicationRecord
  belongs_to :task
  belongs_to :parameter, optional: true

  enum :status, {
    pending: "pending",
    needs_review: "needs_review",
    pass: "pass",
    fail: "fail",
    error: "error"
  }, default: "pending"
end
