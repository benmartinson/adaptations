class RemoveParentTaskIdFromSubTasks < ActiveRecord::Migration[8.1]
  def change
    # Remove foreign key first if it exists
    if foreign_key_exists?(:sub_tasks, column: :parent_task_id)
      remove_foreign_key :sub_tasks, column: :parent_task_id
    end
    # Remove the index if it exists
    if index_exists?(:sub_tasks, :parent_task_id)
      remove_index :sub_tasks, :parent_task_id
    end
    # Remove the column
    remove_column :sub_tasks, :parent_task_id, :integer
  end
end
