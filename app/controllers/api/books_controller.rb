module Api
  class BooksController < ApplicationController
    def index
      render json: Book.all
    end

    def show
      isbn = params[:isbn]
      edition = Edition.includes(:book, contributors: :author).find_by(isbn: isbn)
      
      if edition.present?
        book = Book.includes(:authors, :genres, :movies).find(edition.book_id)
        render json: BookSerializer.new(book, edition).as_json
        return
      end

      # If not found locally, fetch from Open Library API
      begin
        importer = OpenLibraryBookImporter.new(isbn)
        result = importer.import
        book = result[:book]
        edition = result[:edition]

        # Use activejob to save the book and edition
        # SaveBookJob.perform_later(book, edition)

        render json: BookSerializer.new(book, edition).as_json
      rescue OpenLibraryBookImporter::ImportError => e
        render json: { error: e.message }, status: :not_found
      rescue StandardError => e
        render json: { error: "Failed to import book: #{e.message}" }, status: :internal_server_error
      end
    end

    def editions
      work_id = params[:work_id]
      book_id = Book.find_by(work_id: work_id).id
      found_editions = Edition.where(book_id: book_id)

      if found_editions.present? && found_editions.length > 5
        render json: found_editions.first(3)
      else
        importer = OpenLibraryEditionImporter.new(work_id)
        imported_editions = importer.import
        render json: found_editions + imported_editions[:editions].first(5 - found_editions.length)
      end
    end
  end
end
