class AddResolvedApiEndpointToTasks < ActiveRecord::Migration[8.1]
  def change
    add_column :tasks, :resolved_api_endpoint, :text
  end
end
