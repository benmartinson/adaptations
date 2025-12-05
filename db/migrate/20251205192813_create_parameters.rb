class CreateParameters < ActiveRecord::Migration[8.1]
  def change
    create_table :parameters do |t|
      t.string :name
      t.references :task, null: false, foreign_key: true

      t.timestamps
    end
  end
end
