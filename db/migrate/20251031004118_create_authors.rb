class CreateAuthors < ActiveRecord::Migration[8.1]
  def change
    create_table :authors do |t|
      t.string :full_name
      t.integer :birth_year
      t.string :birth_country
      t.string :bio_description
      t.integer :death_year

      t.timestamps
    end
  end
end
