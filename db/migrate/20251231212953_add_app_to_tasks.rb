class AddAppToTasks < ActiveRecord::Migration[8.1]
  def change
    add_reference :tasks, :app, foreign_key: true
  end
end
