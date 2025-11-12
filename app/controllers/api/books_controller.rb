module Api
  class BooksController < ApplicationController
    def index
      render json: Book.all
    end

    def show
      isbn = params[:isbn]
      edition = Edition.includes(:book, edition_contributors: :author).find_by(isbn: isbn)
      book = Book.includes(:authors, :genres, :movies).find(edition.book_id) if edition.present?
      if edition.present? && book.present? && book.authors.any? && book.genres.any?
        book = Book.includes(:authors, :genres, :movies).find(edition.book_id)
        render json: BookSerializer.new(book, edition).as_json
        return
      end

      # If not found locally, fetch from Open Library API
      begin
        importer = OpenLibraryBookImporter.new(isbn: isbn)
        result = importer.import
        book = result[:book]
        edition = result[:edition]
        render json: BookSerializer.new(book, edition).as_json
      rescue OpenLibraryBookImporter::ImportError => e
        render json: { error: e.message }, status: :not_found
      rescue StandardError => e
        render json: { error: "Failed to import book: #{e.message}" }, status: :internal_server_error
      end
    end

    def editions
      work_id = params[:work_id]
      book = Book.find_by(work_id: work_id)
      book_id = book.id if book.present?
      found_editions = book_id.present? ? Edition.where(book_id: book_id) : []

      if found_editions.any? && found_editions.length > 1
        render json: found_editions.first(3)
      else
        importer = OpenLibraryEditionImporter.new(work_id, book_id)
        imported_editions_result = importer.import
        imported_editions = imported_editions_result[:editions].filter { |edition| edition.isbn.present? }
        render json: imported_editions.first(3)
      end
    end
  end
end
