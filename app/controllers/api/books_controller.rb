module Api
  class BooksController < ApplicationController
    def index
      render json: Book.all
    end

    def show
      isbn = params[:isbn]
      edition = Edition.includes(:book, contributors: :author).find_by(isbn: isbn)
      
      if edition.nil?
        render json: { error: "Edition not found" }, status: :not_found
        return
      end
      
      book = Book.includes(:authors, :genres, :movies).find(edition.book_id)
      
      render json: BookSerializer.new(book, edition).as_json
    end
  end
end
