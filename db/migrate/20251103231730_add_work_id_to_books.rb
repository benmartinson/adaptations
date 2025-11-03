class AddWorkIdToBooks < ActiveRecord::Migration[8.1]
  def change
    add_column :books, :work_id, :string
    add_index :books, :work_id, unique: true
  end
end
