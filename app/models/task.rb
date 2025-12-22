class Task < ApplicationRecord
  KINDS = %w[api_transform link].freeze

  has_many :tests, dependent: :destroy
  has_many :task_ui_files, dependent: :destroy
  has_many :sub_tasks, dependent: :destroy  # SubTasks where this task is the parent

  enum :status, {
    pending: "pending",
    running: "running",
    completed: "completed",
    failed: "failed",
    created: "created"
  }, default: "created"

  validates :kind, inclusion: { in: KINDS }

  scope :recent, -> { order(created_at: :desc) }

  def mark_failed!(message)
    update!(
      status: "failed",
      finished_at: Time.current,
      error_message: message
    )
  end

  def mark_completed!(output: nil)
  update!(
      status: "completed",
      finished_at: Time.current,
      output_payload: output || output_payload
    )
  end

  def record_progress!(metadata: {})
    base_metadata = self.metadata.is_a?(Hash) ? self.metadata : {}
    merged_metadata = metadata.present? ? base_metadata.merge(metadata) : base_metadata

    update!(
      metadata: merged_metadata,
      last_progress_at: Time.current
    )
  end

  # Sub-task convenience methods
  def sub_tasks_for(system_tag)
    sub_tasks.where(system_tag: system_tag)
  end

  def parent_sub_tasks_for(system_tag)
    parent_sub_tasks.where(system_tag: system_tag)
  end

  def add_sub_task(child_task, system_tag:, parent_system_tag:)
    sub_tasks.create!(
      task: child_task,
      system_tag: system_tag,
      parent_system_tag: parent_system_tag
    )
  end
end
