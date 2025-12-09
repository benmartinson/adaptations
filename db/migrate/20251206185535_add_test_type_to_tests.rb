class AddTestTypeToTests < ActiveRecord::Migration[8.1]
  def change
    add_column :tests, :test_type, :string, default: "manual"
  end
end
