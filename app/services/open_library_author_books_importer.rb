
class OpenLibraryAuthorBooksImporter
  include OpenLibraryUtils

  BASE_URL = "https://openlibrary.org"

  class ImportError < StandardError; end

  def initialize(author_key)
    @author_key = author_key
  end

  def import
    response = HTTParty.get("#{BASE_URL}/authors/#{@author_key}/works.json")
    unless response.success?
      raise ImportError, "Works not found for author_key: #{@author_key}"
    end
    works = response.parsed_response["entries"]
    works_data = works.filter { |work|
      work["covers"].present? 
    }.map { |work| 
      return {
        work_id: work["key"].split("/").last,
        cover_id: work["covers"].first,
        title: work["title"],
      }
    }

    works_data.map do |work_data|
      book = Book.find_by(work_id: work_data[:work_id])
      book_id = book.id if book.present?
      next if book.present? && Book.authors.find_by(author_key: @author_key).present? && book.editions.any?

      importer = OpenLibraryBookImporter.new(work_data[:work_id])
      result = importer.import
      book = result[:book]
      edition = result[:edition]
    end
  end
end