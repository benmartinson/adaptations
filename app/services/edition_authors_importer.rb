class EditionAuthorsImporter
  include OpenLibraryUtils
  class ImportError < StandardError; end

  def initialize(isbn)
    @isbn = isbn
    @service_procedure = ServiceProcedure.new("OpenLibrary")
  end

  def import
    edition_data = @service_procedure.run_service("IsbnEditionData", {isbn: @isbn})
    work_id = edition_data["work_id"]
    work_data = @service_procedure.run_service("WorkData", {work_id: work_id})
    edition = Edition.find_by(isbn: @isbn)
    extract_contributors(edition_data, edition)
    book = Book.find_by(work_id: work_id)
    extract_authors(edition_data, work_data, book)
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
    use_work_authors = authors.empty?
    if use_work_authors
      authors = work_data["authors"] || []
    end
    authors.map do |author|
      author_key = use_work_authors ? author["author"]["key"].split("/").last : author["key"].split("/").last
      return nil unless author_key.present?
      author = Author.find_by(author_key: author_key)
      if author.nil?
        author = AuthorImporter.new(author_key: author_key).import
      end
      # book.authors << author unless book.authors.include?(author)
    end.filter { |author| author.present? }
  end
end