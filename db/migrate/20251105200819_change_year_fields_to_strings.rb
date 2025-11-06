class ChangeYearFieldsToStrings < ActiveRecord::Migration[8.1]
  def up
    # Change books.year to books.first_published (integer -> string)
    add_column :books, :first_published, :string
    execute "UPDATE books SET first_published = CAST(year AS TEXT) WHERE year IS NOT NULL"
    remove_column :books, :year

    # Change authors.birth_year to authors.birth_date (integer -> string)
    add_column :authors, :birth_date, :string
    execute "UPDATE authors SET birth_date = CAST(birth_year AS TEXT) WHERE birth_year IS NOT NULL"
    remove_column :authors, :birth_year

    # Change authors.death_year to authors.death_date (integer -> string)
    add_column :authors, :death_date, :string
    execute "UPDATE authors SET death_date = CAST(death_year AS TEXT) WHERE death_year IS NOT NULL"
    remove_column :authors, :death_year
  end

  def down
    # Revert books.first_published to books.year (string -> integer)
    add_column :books, :year, :integer
    execute "UPDATE books SET year = CAST(first_published AS INTEGER) WHERE first_published IS NOT NULL AND first_published GLOB '[0-9]*'"
    remove_column :books, :first_published

    # Revert authors.birth_date to authors.birth_year (string -> integer)
    add_column :authors, :birth_year, :integer
    execute "UPDATE authors SET birth_year = CAST(birth_date AS INTEGER) WHERE birth_date IS NOT NULL AND birth_date GLOB '[0-9]*'"
    remove_column :authors, :birth_date

    # Revert authors.death_date to authors.death_year (string -> integer)
    add_column :authors, :death_year, :integer
    execute "UPDATE authors SET death_year = CAST(death_date AS INTEGER) WHERE death_date IS NOT NULL AND death_date GLOB '[0-9]*'"
    remove_column :authors, :death_date
  end
end
