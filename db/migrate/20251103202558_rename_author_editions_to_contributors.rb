class RenameAuthorEditionsToContributors < ActiveRecord::Migration[8.1]
  def change
    rename_table :author_editions, :contributors
    rename_index :contributors, "index_author_editions_on_author_id", "index_contributors_on_author_id"
    rename_index :contributors, "index_author_editions_on_edition_id", "index_contributors_on_edition_id"
  end
end
