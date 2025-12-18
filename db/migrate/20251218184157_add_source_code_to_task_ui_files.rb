class AddSourceCodeToTaskUiFiles < ActiveRecord::Migration[8.1]
  def change
    add_column :task_ui_files, :source_code, :text
  end
end
