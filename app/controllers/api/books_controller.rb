module Api
  class BooksController < ApplicationController
    def index
      render json: Book.all
    end

    def show
      work_id = params[:work_id]
      edition_id = params[:edition_id]
      book = Book.includes(:authors, :genres).find_by(work_id: work_id)
      
      if book.nil?
        render json: { error: "Book not found" }, status: :not_found
        return
      end
      
      if edition_id
        edition = Edition.includes(:book, contributors: :author).find(edition_id)
      else
        edition = book.editions.includes(:book, contributors: :author).first
        if edition.nil?
          render json: { error: "No editions found for this book" }, status: :not_found
          return
        end
      end
      
      render json: BookSerializer.new(book, edition).as_json
    end
  end
end
