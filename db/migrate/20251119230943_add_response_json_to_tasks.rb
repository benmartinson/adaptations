class AddResponseJsonToTasks < ActiveRecord::Migration[8.1]
  def change
    add_column :tasks, :response_json, :json
  end
end
