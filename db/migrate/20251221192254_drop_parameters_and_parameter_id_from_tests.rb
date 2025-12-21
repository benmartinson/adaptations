class DropParametersAndParameterIdFromTests < ActiveRecord::Migration[8.1]
  def change
    # Remove tests -> parameters FK + column
    if foreign_key_exists?(:tests, :parameters)
      remove_foreign_key :tests, :parameters
    end

    if column_exists?(:tests, :parameter_id)
      remove_column :tests, :parameter_id
    end

    # Drop parameters table (and its tasks FK)
    drop_table :parameters, if_exists: true
  end
end
