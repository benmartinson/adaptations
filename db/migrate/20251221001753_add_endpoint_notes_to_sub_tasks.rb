class AddEndpointNotesToSubTasks < ActiveRecord::Migration[8.1]
  def change
    add_column :sub_tasks, :endpoint_notes, :text
  end
end
