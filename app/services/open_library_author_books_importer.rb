
class OpenLibraryAuthorBooksImporter
  include OpenLibraryUtils

  BASE_URL = "https://openlibrary.org"

  class ImportError < StandardError; end

  def initialize(author_key)
    @author_key = author_key
  end

  def import
    service_procedure = ServiceProcedure.new("OpenLibrary")
    works_data = service_procedure.run_service("AuthorBooks", {author_key: @author_key})
    # imported_books = works_data.map do |work_data|
    #   book = Book.find_by(work_id: work_data[:work_id])
    #   book_id = book.id if book.present?
    #   next if book.present? && book.authors.find_by(author_key: @author_key).present? && book.editions.any?

    #   importer = OpenLibraryBookImporter.new(work_id: work_data[:work_id])
    #   result = importer.import
    #   book = result[:book]
    #   edition = result[:edition]
    #   { book: book, edition: edition }
    # end.filter { |result| result.present? }
    works_data
  end
end