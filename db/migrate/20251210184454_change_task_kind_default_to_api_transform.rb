class ChangeTaskKindDefaultToApiTransform < ActiveRecord::Migration[8.1]
  def change
    change_column_default :tasks, :kind, from: "code_workflow", to: "api_transform"
    Task.where(kind: "code_workflow").update_all(kind: "api_transform")
  end
end
