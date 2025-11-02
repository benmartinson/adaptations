class AddSettingAndAsinToBooksAndEditions < ActiveRecord::Migration[7.1]
  def change
    add_column :books, :setting, :string
    add_column :editions, :asin, :string
  end
end
