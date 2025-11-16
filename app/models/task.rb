class Task < ApplicationRecord
  KINDS = %w[code_workflow].freeze

  enum :status, {
    pending: "pending",
    running: "running",
    completed: "completed",
    failed: "failed",
    cancelled: "cancelled"
  }, default: "pending"

  validates :kind, inclusion: { in: KINDS }

  scope :recent, -> { order(created_at: :desc) }

  def request_cancel!(reason: nil)
    return if cancelled?

    update!(
      cancelled_at: Time.current,
      status: "cancelled",
      error_message: reason.presence || error_message
    )
  end

  def cancelled?
    cancelled_at.present?
  end

  def mark_running!
    update!(
      status: "running",
      started_at: started_at || Time.current,
      last_progress_at: Time.current
    )
  end

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

  def increment_tokens!(prompt: 0, completion: 0)
    delta_prompt = prompt.to_i
    delta_completion = completion.to_i

    update!(
      tokens_prompt: tokens_prompt + delta_prompt,
      tokens_completion: tokens_completion + delta_completion,
      tokens_total: tokens_total + delta_prompt + delta_completion
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
