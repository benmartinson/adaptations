class OpenLibraryBookImporter
  BASE_URL = "https://openlibrary.org"

  class ImportError < StandardError; end

  def initialize(isbn)
    @isbn = isbn
  end

  def import
    edition_data = fetch_edition_data
    work_id = extract_work_id(edition_data)
    author_data = extract_author_data(edition_data)
    work_data = fetch_work_data(work_id)

    book = build_book(edition_data, work_id)
    edition = build_edition(edition_data, book)
    associate_genres(work_data, book)

    { book: book, edition: edition }
  rescue HTTParty::Error, JSON::ParserError => e
    raise ImportError, "Failed to fetch book data: #{e.message}"
  end

  private

  def fetch_edition_data
    response = HTTParty.get("#{BASE_URL}/isbn/#{@isbn}.json")
    
    unless response.success?
      raise ImportError, "Book not found for ISBN: #{@isbn}"
    end

    data = response.parsed_response
    
    unless data.present?
      raise ImportError, "Empty response for ISBN: #{@isbn}"
    end

    data
  end

  def extract_work_id(edition_data)
    work_id = edition_data["works"]&.first&.dig("key") || edition_data["key"]
    return nil unless work_id.present?
    
    work_id.to_s.gsub(/^\/works\//, "")
  end

  def extract_author_data(edition_data)
    authors = edition_data["authors"] || []
    authors.map do |author|
      author_key = author["key"]
      return nil unless author_key.present?

      response = HTTParty.get("#{BASE_URL}/authors/#{author_key}.json")
      unless response.success?
        raise ImportError, "Author not found for author_key: #{author_key}"
      end

      author_data = response.parsed_response
      return nil unless author_data.present?

      author_data["personal_name"]
    end
  end

  def fetch_work_data(work_id)
    return {} unless work_id.present?

    response = HTTParty.get("#{BASE_URL}/works/#{work_id}.json")
    
    unless response.success?
      raise ImportError, "Work not found for work_id: #{work_id}"
    end

    response.parsed_response || {}
  end

  def build_book(edition_data, work_id)
    description = edition_data["description"]
    description = description.is_a?(Hash) ? description["value"] : description

    Book.new(
      work_id: work_id,
      title: edition_data["title"],
      year: parse_year(edition_data["publish_date"]),
      description: description,
      setting: "England" # TODO: Extract from data or make configurable
    )
  end

  def build_edition(edition_data, book)
    isbn = edition_data["isbn_13"]&.first || edition_data["isbn_10"]&.first || @isbn
    description = edition_data["description"]
    description = description.is_a?(Hash) ? description["value"] : description
    language_key = edition_data["languages"]&.first&.dig("key")
    language = language_key ? language_key.split("/").last.upcase : nil

    Edition.new(
      isbn: isbn,
      description: description,
      publisher: edition_data["publishers"]&.first,
      publication_date: parse_date(edition_data["publish_date"]),
      format: format_string(edition_data["number_of_pages"]),
      primary_edition: 1,
      language: language,
      book: book
    )
  end

  def associate_genres(work_data, book)
    subjects = work_data["subjects"] || []
    
    subjects.first(3).each do |subject|
      genre = Genre.find_or_create_by(name: subject)
      book.genres << genre unless book.genres.include?(genre)
    end
  end

  def parse_year(publish_date)
    return nil unless publish_date.present?
    
    # Handle various date formats
    case publish_date
    when Integer
      publish_date
    when String
      # Try to extract year from string like "2023" or "January 2023"
      year_match = publish_date.match(/\b(\d{4})\b/)
      year_match ? year_match[1].to_i : nil
    else
      nil
    end
  end

  def parse_date(publish_date)
    return nil unless publish_date.present?
    
    # Try to parse as date
    Date.parse(publish_date.to_s) rescue nil
  end

  def format_string(pages)
    return nil unless pages.present?
    "#{pages} pages"
  end
end

