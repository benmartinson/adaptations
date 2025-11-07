class CreateEditionContributors < ActiveRecord::Migration[8.1]
  def change
    create_table :edition_contributors do |t|
      t.references :edition, null: false, foreign_key: true
      t.string :name
      t.string :role

      t.timestamps
    end
  end
end
