class RenameKindLinkToSubtaskConnector < ActiveRecord::Migration[8.1]
  def up
    execute "UPDATE tasks SET kind = 'subtask_connector' WHERE kind = 'link'"
  end

  def down
    execute "UPDATE tasks SET kind = 'link' WHERE kind = 'subtask_connector'"
  end
end
