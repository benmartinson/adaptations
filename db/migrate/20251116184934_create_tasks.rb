class CreateTasks < ActiveRecord::Migration[8.1]
  def change
    create_table :tasks do |t|
      t.string :kind, null: false, default: "code_workflow"
      t.string :status, null: false, default: "pending"
      t.datetime :started_at
      t.datetime :finished_at
      t.datetime :cancelled_at
      t.datetime :last_progress_at
      t.string :job_id
      t.integer :tokens_prompt, null: false, default: 0
      t.integer :tokens_completion, null: false, default: 0
      t.integer :tokens_total, null: false, default: 0
      t.json :input_payload, default: {}
      t.json :output_payload, default: {}
      t.json :metadata, default: {}
      t.text :error_message

      t.timestamps
    end

    add_index :tasks, :status
    add_index :tasks, :kind
    add_index :tasks, :created_at
  end
end
