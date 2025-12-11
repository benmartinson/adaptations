class AddToSystemTagToTasks < ActiveRecord::Migration[8.1]
  def change
    add_column :tasks, :to_system_tag, :string
  end
end
