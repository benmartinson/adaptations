class OpenLibraryEditionImporter  
  include OpenLibraryUtils
  
  BASE_URL = "https://openlibrary.org"

  class ImportError < StandardError; end

  def initialize(work_id)
    @work_id = work_id
    @book_id = Book.find_by(work_id: work_id).id
  end

  def import
    editions_data = fetch_edition_data
    editions = editions_data.first(3).map { |edition_data| build_edition(edition_data) }
    { editions: editions }
  end

  private

  def fetch_edition_data
    response = HTTParty.get("#{BASE_URL}/works/#{@work_id}/editions.json")

    unless response.success?
      raise ImportError, "Editions not found for work_id: #{@work_id}"
    end

    response.parsed_response["entries"].first(10)
  end

  def build_edition(edition_data)
    publish_date = normalize_date(edition_data["publish_date"])

    format = edition_data["number_of_pages"] ? "#{edition_data["number_of_pages"]} pages" : nil
    # if physical_format has commas, take the first part
    if edition_data["physical_format"].present?
      physical_format = edition_data["physical_format"].split(",").first
      format = "#{format}, #{physical_format}"
    end

    Edition.new(
      book_id: @book_id,
      isbn: edition_data["isbn_13"]&.first,
      publisher: edition_data["publishers"]&.first,
      publication_date: publish_date,
      format: format,
    )
  end
end