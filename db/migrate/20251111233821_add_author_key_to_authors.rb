class AddAuthorKeyToAuthors < ActiveRecord::Migration[8.1]
  def change
    add_column :authors, :author_key, :string
    add_index :authors, :author_key, unique: true
  end
end
