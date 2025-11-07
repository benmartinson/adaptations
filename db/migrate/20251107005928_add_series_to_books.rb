class AddSeriesToBooks < ActiveRecord::Migration[8.1]
  def change
    add_column :books, :series, :string
  end
end
