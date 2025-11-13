class OpenLibraryEditionImporter  
  include OpenLibraryUtils
  
  BASE_URL = "https://openlibrary.org"

  class ImportError < StandardError; end

  def initialize(work_id, book_id)
    @work_id = work_id
    @book_id = book_id
  end

  def import
    editions_data = fetch_edition_data
    # prioritize editions using points system (higher = better)
    # Format: +3 points, Description: +2 points, Image: +2 points, English: +1 point
    editions = editions_data.sort_by { |edition_data|
      language_key = edition_data["languages"]&.first&.dig("key")
      is_english = language_key == "/languages/eng"
      has_format = edition_data["physical_format"] && edition_data["number_of_pages"].present?
      description = edition_data["description"]
      has_description = if description.is_a?(Hash)
        description["value"].present?
      else
        description.present?
      end
      
      # Check if image URL exists
      isbn = edition_data["isbn_13"]&.first || edition_data["isbn_10"]&.first
      has_image = isbn.present? && image_url_exists?(isbn)
      
      points = 0
      points += 3 if has_format
      points += 3 if has_image
      points += 2 if has_description
      points += 1 if is_english
      edition_data["should_save"] = points >= 5
      -points # negate for descending order
    }.first(3).map { |edition_data| build_edition(edition_data) }

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

    isbn = edition_data["isbn_13"]&.first
    edition = Edition.new(
      book_id: @book_id,
      isbn: isbn,
      publisher: edition_data["publishers"]&.first,
      publication_date: publish_date,
      format: format,
    )

    if edition_data["should_save"] && Edition.find_by(isbn: isbn).nil?
      description = edition_data["description"]
      description = description.is_a?(Hash) ? description["value"] : description
      language_key = edition_data["languages"]&.first&.dig("key")
      language = language_from_key(language_key)
      edition.description = description
      edition.language = language
      edition.save
    end
    edition
  end

  def image_url_exists?(isbn)
    return false unless isbn.present?
    
    image_url = "https://covers.openlibrary.org/b/isbn/#{isbn}-L.jpg?default=false"
    
    response = HTTParty.head(image_url, timeout: 2)
    response.success?
  rescue HTTParty::Error, Net::ReadTimeout, Net::OpenTimeout, SocketError
    false
  end
end