class CreateRequestProcedures < ActiveRecord::Migration[8.1]
  def change
    create_table :request_procedures do |t|
      t.references :api_request, null: false, foreign_key: true
      t.integer :order
      t.string :procedure_type

      t.timestamps
    end
  end
end
