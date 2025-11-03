module Api
  class BooksController < ApplicationController
    def index
      render json: Book.all
    end

    def show
      edition = Edition.includes(:book, contributors: :author).find(params[:id])
      book = Book.includes(:authors, :genres).find(edition.book_id)
      render json: BookSerializer.new(book, edition).as_json
    end
  end
end
