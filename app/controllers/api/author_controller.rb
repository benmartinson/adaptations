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

    def books
      author = Author.friendly.find(params[:slug])
      author_key = author.author_key
      raise "Author key not found" unless author_key.present?

      books = author.books.includes(:authors, :genres, :movies).first(3)
      if books.any? && books.length > 1
        render json: books
      else
        importer = OpenLibraryAuthorBooksImporter.new(author_key: author_key)
        books = importer.import
        author.books << books
        render json: books
      end
    end
  end

end
