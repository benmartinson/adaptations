class Test < ApplicationRecord
  belongs_to :task

  enum :status, {
    pending: "pending",
    pass: "pass",
    fail: "fail"
  }, default: "pending"
end
