class AddSystemTagToTasks < ActiveRecord::Migration[8.1]
  def change
    add_column :tasks, :system_tag, :string
  end
end
