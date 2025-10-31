module Api
  class BooksController < ApplicationController
    def index
      render json: Book.all
    end

    def show
      book = Book.includes(:authors).find(params[:id])
      render json: book.as_json(include: { authors: { only: [:id, :full_name] } })
    end
  end
end
