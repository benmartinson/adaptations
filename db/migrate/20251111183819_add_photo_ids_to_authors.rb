class AddPhotoIdsToAuthors < ActiveRecord::Migration[8.1]
  def change
    add_column :authors, :photo_ids, :json, default: []
  end
end
