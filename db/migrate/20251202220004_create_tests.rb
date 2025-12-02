class CreateTests < ActiveRecord::Migration[8.1]
  def change
    create_table :tests do |t|
      t.string :api_endpoint
      t.references :task, null: false, foreign_key: true
      t.string :status, default: "pending"
      t.json :from_response
      t.json :expected_output
      t.json :actual_output
      t.text :error_message
      t.integer :attempts, default: 0

      t.timestamps
    end
  end
end
