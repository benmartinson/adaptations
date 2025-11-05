class CreateMovieBooks < ActiveRecord::Migration[8.1]
  def change
    create_table :movie_books do |t|
      t.references :movie, null: false, foreign_key: true
      t.references :book, null: false, foreign_key: true

      t.timestamps
    end
  end
end
