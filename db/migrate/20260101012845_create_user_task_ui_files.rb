class CreateUserTaskUiFiles < ActiveRecord::Migration[8.1]
  def change
    create_table :user_task_ui_files do |t|
      t.references :template_file, null: false, foreign_key: { to_table: :task_ui_files }
      t.references :override_file, null: false, foreign_key: { to_table: :task_ui_files }
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end
  end
end
