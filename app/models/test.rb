class Test < ApplicationRecord
  belongs_to :task
  belongs_to :parameter, optional: true

  enum :status, {
    pending: "pending",
    created: "created",
    needs_review: "needs_review",
    changes_needed: "changes_needed",
    pass: "pass",
    fail: "fail",
    error: "error"
  }, default: "created"

  enum :test_type, {
    manual: "manual",
    automated: "automated"
  }, default: "manual"
end
