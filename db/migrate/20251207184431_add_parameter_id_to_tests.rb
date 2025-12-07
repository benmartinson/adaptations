class AddParameterIdToTests < ActiveRecord::Migration[8.1]
  def change
    add_reference :tests, :parameter, null: true, foreign_key: true
  end
end
