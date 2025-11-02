class CreateEditions < ActiveRecord::Migration[8.1]
  def change
    create_table :editions do |t|
      t.references :book, null: false, foreign_key: true
      t.string :isbn
      t.string :publisher
      t.date :publication_date
      t.string :format
      t.integer :primary_edition
      t.string :description
      t.string :language

      t.timestamps
    end
  end
end
