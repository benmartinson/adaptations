class AddApiEndpointToTasks < ActiveRecord::Migration[8.1]
  def change
    add_column :tasks, :api_endpoint, :text
  end
end
