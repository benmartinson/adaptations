class AddTransformCodeToTasks < ActiveRecord::Migration[8.1]
  def change
    add_column :tasks, :transform_code, :text
  end
end
