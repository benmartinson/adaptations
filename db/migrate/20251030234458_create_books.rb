class CreateBooks < ActiveRecord::Migration[8.1]
  def change
    create_table :books do |t|
      t.string :title
      t.integer :year
      t.text :description

      t.timestamps
    end
  end
end
