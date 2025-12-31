class AddIsActiveToTasks < ActiveRecord::Migration[8.1]
  def change
    add_column :tasks, :is_active, :boolean, default: false, null: false
  end
end
