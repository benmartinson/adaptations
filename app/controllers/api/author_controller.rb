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
        importer = AuthorImporter.new(slug: params[:slug])
        author = importer.import
        render json: author
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
        importer = AuthorBooksImporter.new(author_key, author.full_name)
        books = importer.import
        render json: books
      end
    end
  end

end
