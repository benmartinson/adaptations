class BookImporter
  include OpenLibraryUtils
  class ImportError < StandardError; end

  def initialize(isbn: nil)
    @isbn = isbn
    @service_procedure = ServiceProcedure.new("OpenLibrary")

    if @isbn.nil?
      raise ArgumentError, "ISBN is required"
    end
  end

  def import
    # if !@isbn.present?
    #   primary_edition = EditionImporter.new(@work_id, nil).import[:editions].first
    #   @isbn = primary_edition.isbn
    # end
    edition_data = @service_procedure.run_service("IsbnEditionData", {isbn: @isbn})
    @work_id = edition_data["work_id"]
    work_data = @service_procedure.run_service("WorkData", {work_id: @work_id}) 
    book = Book.find_by(work_id: @work_id)
    if book.nil?
      book = build_book(edition_data, work_data)
      book.save
    end

    edition = Edition.find_by(isbn: @isbn)
    if edition.nil?
      edition = build_edition(edition_data, work_data, book)
      edition.save
    end

    { book: book, edition: edition }
  rescue HTTParty::Error, JSON::ParserError => e
    raise ImportError, "Failed to fetch book data: #{e.message}"
  end

  private

  def build_book(edition_data, work_data)
    description = work_data["description"] || edition_data["description"] || ""
    Book.new(
      work_id: edition_data["work_id"],
      title: edition_data["title"],
      series: edition_data["series"],
      first_published: edition_data["first_published"],
      description: description,
    )
  end

  def build_edition(edition_data, work_data, book)
    description = edition_data["description"] || work_data["description"] || ""
    Edition.new(
      isbn: @isbn,
      description: description,
      publisher: edition_data["publisher"],
      publication_date: edition_data["publication_date"],
      format: edition_data["format"],
      primary_edition: 1,
      language: edition_data["language"],
      book: book
    )
  end
end
