class CreateTaskUiFiles < ActiveRecord::Migration[8.1]
  def change
    create_table :task_ui_files do |t|
      t.references :task, null: false, foreign_key: true
      t.string :file_name
      t.boolean :is_active

      t.timestamps
    end
  end
end
