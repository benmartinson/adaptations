require "test_helper"

class CodeWorkflowJobTest < ActiveJob::TestCase
  setup do
    @task = Task.create!(
      kind: "code_workflow",
      input_payload: {
        "instructions" => "Return entries with work_id field",
        "test_cases" => [
          {
            "name" => "passes through entries",
            "input" => { "entries" => [{ "key" => "/works/OL1W", "covers" => [123], "title" => "Title" }] },
            "expected_output" => [
              { "work_id" => "OL1W", "cover_id" => 123, "title" => "Title" }
            ]
          }
        ]
      }
    )
  end

  test "completes workflow and stores output" do
    sandbox_result = [{ "work_id" => "OL1W", "cover_id" => 123, "title" => "Title" }]
    events = []

    RubySandbox.stub(:run, sandbox_result) do
      TaskChannel.stub(:broadcast_to, ->(_task, payload) { events << payload }) do
        perform_enqueued_jobs_only(@task.id)
      end
    end

    @task.reload
    assert_equal "completed", @task.status
    assert_equal sandbox_result, @task.output_payload["tests"].first["output"]
    assert events.any? { |event| event[:phase] == "completed" }
  end

  test "returns early when task already cancelled" do
    @task.request_cancel!("User cancelled")

    RubySandbox.stub(:run, []) do
      TaskChannel.stub(:broadcast_to, ->(*) {}) do
        perform_enqueued_jobs_only(@task.id)
      end
    end

    @task.reload
    assert_equal "cancelled", @task.status
  end

  test "marks failed when sandbox raises" do
    RubySandbox.stub(:run, ->(*) { raise "boom" }) do
      TaskChannel.stub(:broadcast_to, ->(*) {}) do
        perform_enqueued_jobs_only(@task.id)
      end
    end

    @task.reload
    assert_equal "failed", @task.status
    assert_match "boom", @task.error_message
  end

  private

  def perform_enqueued_jobs_only(task_id)
    # Call perform_now to keep ActiveJob callbacks in place
    CodeWorkflowJob.perform_now(task_id)
  end
end

