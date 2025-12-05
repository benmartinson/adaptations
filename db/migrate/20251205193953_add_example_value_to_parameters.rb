class AddExampleValueToParameters < ActiveRecord::Migration[8.1]
  def change
    add_column :parameters, :example_value, :string
  end
end
