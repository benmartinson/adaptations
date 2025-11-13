
class OpenLibraryAuthorBooksImporter
  include OpenLibraryUtils

  BASE_URL = "https://openlibrary.org"

  class ImportError < StandardError; end

  def initialize(author_key)
    @author_key = author_key
  end

  def import

    service_procedure = ServiceProcedure.new("OpenLibraryAuthorBooksImporter")
    works_data = service_procedure.run_service({author_key: @author_key})
    # response = HTTParty.get("#{BASE_URL}/authors/#{@author_key}/works.json")
    # unless response.success?
    #   raise ImportError, "Works not found for author_key: #{@author_key}"
    # end
    # works = response.parsed_response["entries"]
    # works_data = works.filter { |work|
    #   work["covers"].present? 
    # }.map { |work| 
    #   {
    #     work_id: work["key"].split("/").last,
    #     cover_id: work["covers"].first,
    #     title: work["title"],
    #   }
    # }
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