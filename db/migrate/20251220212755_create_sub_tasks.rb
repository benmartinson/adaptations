class CreateSubTasks < ActiveRecord::Migration[8.1]
  def change
    create_table :sub_tasks do |t|
      t.references :task, null: false, foreign_key: true
      t.references :parent_task, null: false, foreign_key: true
      t.string :system_tag
      t.string :parent_system_tag

      t.timestamps
    end
  end
end
