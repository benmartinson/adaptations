class CreateProcedureFields < ActiveRecord::Migration[8.1]
  def change
    create_table :procedure_fields do |t|
      t.references :request_procedure, null: false, foreign_key: true
      t.boolean :is_Param
      t.string :from
      t.string :to
      t.string :from_type
      t.string :to_type
      t.string :transform

      t.timestamps
    end
  end
end
