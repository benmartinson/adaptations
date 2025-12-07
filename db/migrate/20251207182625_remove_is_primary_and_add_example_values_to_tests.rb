class RemoveIsPrimaryAndAddExampleValuesToTests < ActiveRecord::Migration[8.1]
  def change
    remove_column :tests, :is_primary, :boolean
    remove_column :tests, :test_type, :string
    add_column :tests, :example_values, :json, default: []
  end
end
