class AddExampleValuesToParameters < ActiveRecord::Migration[8.1]
  def change
    add_column :parameters, :example_values, :json, default: []
  end
end
