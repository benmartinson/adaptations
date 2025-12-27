class AddElementTypeToTasks < ActiveRecord::Migration[8.1]
  def change
    add_column :tasks, :element_type, :string
  end
end
