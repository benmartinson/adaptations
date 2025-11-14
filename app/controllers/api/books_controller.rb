module Api
  class BooksController < ApplicationController
    def index
      render json: Book.all
    end

    def show
      isbn = params[:isbn]
      edition = Edition.find_by(isbn: isbn)
      book = Book.find(edition.book_id) if edition.present?

      if edition.nil? || book.nil?
        importer = BookImporter.new(isbn)
        result = importer.import
        book = result[:book]
      end

      if book.genres.empty?
        book_genre_importer = BookGenreImporter.new(book.work_id)
        book_genre_importer.import
      end

      if book.authors.empty?
        edition_authors_importer = EditionAuthorsImporter.new(isbn)
        edition_authors_importer.import
      end

      edition = Edition.includes(:book, edition_contributors: :author).find_by(isbn: isbn)
      book = Book.includes(:authors, :genres, :movies).find(edition.book_id)
      render json: BookSerializer.new(book, edition).as_json
    end

    def editions
      work_id = params[:work_id]
      book = Book.find_by(work_id: work_id)
      book_id = book.id if book.present?
      found_editions = book_id.present? ? Edition.where(book_id: book_id) : []

      if found_editions.any? && found_editions.length > 1
        render json: found_editions.first(3)
      else
        importer = EditionImporter.new(work_id, book_id)
        imported_editions_result = importer.import
        imported_editions = imported_editions_result[:editions].filter { |edition| edition.isbn.present? }
        render json: imported_editions.first(3)
      end
    end
  end
end
