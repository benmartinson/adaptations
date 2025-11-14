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

      books = author.books.includes(:authors, :genres, :editions)
      if books.any?
        render json: books.as_json(include: { genres: { only: [:id, :name] }, editions: { only: [:id, :format, :publication_date, :publisher, :isbn, :language, :description, :asin] } })
      else
        importer = AuthorBooksImporter.new(author_key, author.full_name)
        result = importer.import
        books = author.books.includes(:authors, :genres)
        render json: books.as_json(include: { genres: { only: [:id, :name] }, editions: { only: [:id, :format, :publication_date, :publisher, :isbn, :language, :description, :asin] } })
      end
    end
  end

end
