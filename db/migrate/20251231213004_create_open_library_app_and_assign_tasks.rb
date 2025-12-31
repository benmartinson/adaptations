class CreateOpenLibraryAppAndAssignTasks < ActiveRecord::Migration[8.1]
  def up
    # Create the OpenLibrary app
    app = App.create!(
      name: 'OpenLibrary',
      description: 'Integration with OpenLibrary API for book data and metadata'
    )

    # Assign all existing tasks to the OpenLibrary app
    Task.update_all(app_id: app.id)

    # Add NOT NULL constraint to app_id column
    change_column_null :tasks, :app_id, false
  end

  def down
    # Remove NOT NULL constraint from app_id column
    change_column_null :tasks, :app_id, true

    # Remove all app assignments from tasks
    Task.update_all(app_id: nil)

    # Delete the OpenLibrary app
    App.find_by(name: 'OpenLibrary')&.destroy
  end
end
