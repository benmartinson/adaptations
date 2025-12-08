class AddNotesToTests < ActiveRecord::Migration[8.1]
  def change
    add_column :tests, :notes, :text
  end
end
