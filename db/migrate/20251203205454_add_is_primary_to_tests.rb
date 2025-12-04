class AddIsPrimaryToTests < ActiveRecord::Migration[8.1]
  def change
    add_column :tests, :is_primary, :boolean, default: false
  end
end
