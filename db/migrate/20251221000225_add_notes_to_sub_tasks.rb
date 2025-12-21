class AddNotesToSubTasks < ActiveRecord::Migration[8.1]
  def change
    add_column :sub_tasks, :notes, :text
  end
end
