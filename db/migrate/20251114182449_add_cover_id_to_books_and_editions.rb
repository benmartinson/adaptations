class AddCoverIdToBooksAndEditions < ActiveRecord::Migration[8.1]
  def change
    add_column :books, :cover_id, :string
    add_column :editions, :cover_id, :string
  end
end
