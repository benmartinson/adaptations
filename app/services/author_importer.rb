class AuthorImporter
  include OpenLibraryUtils
  class ImportError < StandardError; end

  def initialize(slug: nil, author_key: nil)
    @slug = slug
    @author_key = author_key
    @service_procedure = ServiceProcedure.new("OpenLibrary")
    
    if @slug.nil? && @author_key.nil?
      raise ArgumentError, "Either slug or author_key must be provided"
    end
  end

  def import
    author_key = @author_key || @service_procedure.run_service("SearchAuthorFromSlug", {slug: @slug})
    author_data = @service_procedure.run_service("AuthorData", {author_key: author_key})
    build_author(author_data, author_key)
  end

  def build_author(author_data, author_key)
    Author.find_or_create_by(
      author_key: author_key,
      full_name: author_data[:full_name],
      bio_description: author_data[:bio],
      birth_date: author_data[:birth_date],
      death_date: author_data[:death_date],
      photo_ids: author_data[:photo_ids],
    )
  end
end