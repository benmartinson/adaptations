class Task < ApplicationRecord
  KINDS = %w[api_transform link].freeze

  has_many :tests, dependent: :destroy
  has_many :task_ui_files, dependent: :destroy

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
end
