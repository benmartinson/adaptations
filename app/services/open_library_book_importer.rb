class OpenLibraryBookImporter
  include OpenLibraryUtils
  
  BASE_URL = "https://openlibrary.org"

  class ImportError < StandardError; end

  def initialize(isbn)
    @isbn = isbn
  end

  def import
    edition_data = fetch_edition_data
    work_id = extract_work_id(edition_data)
    work_data = fetch_work_data(work_id)

    book = Book.find_by(work_id: work_id)
    if book.nil?
      book = build_book(edition_data, work_data, work_id)
      associate_genres(work_data, book)
      book.save
    end

    extract_authors(edition_data, work_data, book) unless book.authors.any?

    edition = Edition.find_by(isbn: @isbn)
    if edition.nil?
      edition = build_edition(edition_data, book)
      extract_contributors(edition_data, edition)
      edition.save
    end

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

  def extract_contributors(edition_data, edition)
    # Handle two formats:
    # 1. "contributors": [{"role": "Translator", "name": "Javier Altayó"}]
    # 2. "contributions": ["Arthur C. Clarke (Introduction)"]
    contributors = []
    if edition_data["contributors"].present?
      edition_data["contributors"].each do |contributor|
        next unless contributor.is_a?(Hash)
        
        contributor_name = contributor["name"]
        next unless contributor_name.present?

        contributors << EditionContributor.new(
          name: contributor_name,
          role: contributor["role"]
        )
      end
    end
    
    if edition_data["contributions"].present?
      edition_data["contributions"].each do |contribution|
        next unless contribution.is_a?(String)
        
        # Parse format: "Name (Role)" or just "Name"
        match = contribution.match(/^(.+?)\s*\(([^)]+)\)$/)
        if match
          # Has role in parentheses
          name = match[1].strip
          role = match[2].strip
        else
          name = contribution.strip
          role = nil
        end
        
        next unless name.present?
        
        contributors << EditionContributor.new(
          name: name,
          role: role
        )
      end
    end
    
    contributors.each do |contributor|
      edition.edition_contributors << contributor unless edition.edition_contributors.any? { |ec| ec.name == contributor.name && ec.role == contributor.role }
    end
  end

  def extract_authors(edition_data, work_data, book)
    authors = edition_data["authors"] || []
    is_work_authors = authors.empty?
    if is_work_authors
      authors = work_data["authors"] || []
    end
    authors.map do |author|
      author_key = is_work_authors ? author["author"]["key"].split("/").last : author["key"].split("/").last
      return nil unless author_key.present?

      response = HTTParty.get("#{BASE_URL}/authors/#{author_key}.json")
      unless response.success?
        raise ImportError, "Author not found for author_key: #{author_key}"
      end

      author_data = response.parsed_response
      return nil unless author_data.present?

      author_name = author_data["personal_name"] || author_data["name"]
      return nil unless author_name.present?

      author = Author.new(
        full_name: author_name,
        bio_description: author_data["bio"],
        birth_date: author_data["birth_date"]&.to_s,
        death_date: author_data["death_date"]&.to_s
      )
      book.authors << author unless book.authors.include?(author)
    end.filter { |author| author.present? }
  end

  def fetch_work_data(work_id)
    return {} unless work_id.present?

    response = HTTParty.get("#{BASE_URL}/works/#{work_id}.json")
    
    unless response.success?
      raise ImportError, "Work not found for work_id: #{work_id}"
    end

    response.parsed_response || {}
  end

  def build_book(edition_data, work_data, work_id)
    description = work_data["description"]
    description = description.is_a?(Hash) ? description["value"] : description
    
    Book.new(
      work_id: work_id,
      title: edition_data["title"],
      series: edition_data["series"]&.first,
      first_published: parse_first_published(edition_data["publish_date"]),
      description: description,
    )
  end

  def build_edition(edition_data, book)
    description = edition_data["description"]
    description = description.is_a?(Hash) ? description["value"] : description
    language_key = edition_data["languages"]&.first&.dig("key")
    language = language_from_key(language_key)
    format = get_format(edition_data)
    publish_date = normalize_date(edition_data["publish_date"])
    publisher = edition_data["publishers"]&.first

    Edition.new(
      isbn: @isbn,
      description: description,
      publisher: publisher,
      publication_date: publish_date,
      format: format,
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

  def parse_first_published(publish_date)
    return nil unless publish_date.present?
    publish_date.to_s
  end

  def parse_date(publish_date)
    return nil unless publish_date.present?
    normalized = normalize_date(publish_date)
    Date.parse(normalized.to_s) rescue nil
  end

  def format_string(pages)
    return nil unless pages.present?
    "#{pages} pages"
  end
end

