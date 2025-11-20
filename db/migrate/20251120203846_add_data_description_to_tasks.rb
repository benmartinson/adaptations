class AddDataDescriptionToTasks < ActiveRecord::Migration[8.1]
  def change
    add_column :tasks, :data_description, :text
  end
end
