class CreateApiServices < ActiveRecord::Migration[8.1]
  def change
    create_table :api_services do |t|
      t.string :name
      t.string :base_url

      t.timestamps
    end
  end
end
