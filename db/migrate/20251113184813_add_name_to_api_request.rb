class AddNameToApiRequest < ActiveRecord::Migration[8.1]
  def change
    add_column :api_requests, :name, :string
    add_index :api_requests, :name, unique: true
  end
end
