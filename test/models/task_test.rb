require "test_helper"

class TaskTest < ActiveSupport::TestCase
  # test "is valid with default attributes" do
  #   task = Task.new(kind: "code_workflow")
  #   assert task.valid?
  #   assert_equal "pending", task.status
  # end

  # test "request_cancel updates status and reason" do
  #   task = tasks(:running)
  #   task.request_cancel!(reason: "User cancelled")

  #   assert task.cancelled?
  #   assert_equal "cancelled", task.status
  #   assert_not_nil task.cancelled_at
  #   assert_equal "User cancelled", task.error_message
  # end

  # test "mark_completed stores output payload" do
  #   task = Task.create!(kind: "code_workflow")
  #   payload = { "code" => "def hi; end" }

  #   task.mark_completed!(output: payload)

  #   assert_equal "completed", task.status
  #   assert_equal payload, task.output_payload
  #   assert_not_nil task.finished_at
  # end

  # test "increment_tokens increases totals" do
  #   task = tasks(:basic)
  #   task.increment_tokens!(prompt: 5, completion: 7)

  #   assert_equal 5, task.tokens_prompt
  #   assert_equal 7, task.tokens_completion
  #   assert_equal 12, task.tokens_total
  # end

  # test "record_progress merges metadata" do
  #   task = tasks(:basic)
  #   task.record_progress!(metadata: { "phase" => "coding" })

  #   assert_equal "coding", task.metadata["phase"]
  #   assert_not_nil task.last_progress_at
  # end
end
