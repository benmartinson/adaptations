class CreateAuthorEditions < ActiveRecord::Migration[8.1]
  def change
    create_table :author_editions do |t|
      t.references :author, null: false, foreign_key: true
      t.references :edition, null: false, foreign_key: true
      t.string :role_description

      t.timestamps
    end
  end
end
