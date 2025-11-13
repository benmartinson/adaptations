class DropApiRequestApiServiceProcedureFieldRequestProcedure < ActiveRecord::Migration[8.1]
  def change
    # Drop tables in reverse dependency order
    drop_table :procedure_fields, if_exists: true
    drop_table :request_procedures, if_exists: true
    drop_table :api_requests, if_exists: true
    drop_table :api_services, if_exists: true
  end
end
