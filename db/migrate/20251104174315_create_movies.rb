class CreateMovies < ActiveRecord::Migration[8.1]
  def change
    create_table :movies do |t|
      t.date :release_date
      t.string :synopsis
      t.string :title
      t.integer :runtime
      t.string :rating

      t.timestamps
    end
  end
end
