class AddDescriptionToTests < ActiveRecord::Migration[8.1]
  def change
    add_column :tests, :description, :text
  end
end
