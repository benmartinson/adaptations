module Api
  class BooksController < ApplicationController
    def index
      render json: Book.all
    end

    def show
      book = Book.includes(:authors).find(params[:id])
      render json: BookSerializer.new(book).as_json
    end
  end
end
