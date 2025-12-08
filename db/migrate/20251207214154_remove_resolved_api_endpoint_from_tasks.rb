class RemoveResolvedApiEndpointFromTasks < ActiveRecord::Migration[8.1]
  def change
    remove_column :tasks, :resolved_api_endpoint, :text
  end
end
