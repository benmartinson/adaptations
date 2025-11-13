class CreateApiRequests < ActiveRecord::Migration[8.1]
  def change
    create_table :api_requests do |t|
      t.references :api_service, null: false, foreign_key: true
      t.integer :order
      t.string :url
      t.json :params

      t.timestamps
    end
  end
end
