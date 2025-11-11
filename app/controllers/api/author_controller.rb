module Api
  class AuthorController < ApplicationController
    def index
      render json: Author.all
    end

    def show
      begin
        author = Author.friendly.find(params[:slug])
        render json: author
      rescue ActiveRecord::RecordNotFound
        begin
          importer = OpenLibraryAuthorImporter.new(slug: params[:slug])
          author = importer.import
          render json: author
        rescue OpenLibraryAuthorImporter::ImportError => e
          render json: { error: e.message }, status: :not_found
        rescue StandardError => e
          render json: { error: "Failed to import author: #{e.message}" }, status: :internal_server_error
        end
      end
    end
  end

end
