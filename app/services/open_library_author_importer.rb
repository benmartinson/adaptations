class OpenLibraryAuthorImporter
  include OpenLibraryUtils

  BASE_URL = "https://openlibrary.org"

  class ImportError < StandardError; end

  def initialize(slug: nil, author_key: nil)
    @slug = slug
    @author_key = author_key
    
    if @slug.nil? && @author_key.nil?
      raise ArgumentError, "Either slug or author_key must be provided"
    end
  end

  def import
    author_key = @author_key || get_author_key(@slug)
    author_data = get_author_data(author_key)
    build_author(author_data, author_key)
  end

  def get_author_key(slug)
    response = HTTParty.get("#{BASE_URL}/search.json?author=#{@slug}&limit=3")
    unless response.success?
      raise ImportError, "Author not found for slug: #{@slug}"
    end

    author_data = response.parsed_response["docs"].find do |doc|
      doc["author_name"]&.first&.parameterize == @slug
    end

    unless author_data.present?
      raise ImportError, "Author not found for slug: #{@slug}"
    end
    author_data["author_key"].first
  end

  def get_author_data(author_key)
    response = HTTParty.get("#{BASE_URL}/authors/#{author_key}.json")
    unless response.success?
      raise ImportError, "Author not found for author_key: #{author_key}"
    end
    response.parsed_response
  end

  def build_author(author_data, author_key)
    bio = author_data["bio"]
    bio = bio.is_a?(Hash) ? bio["value"] : bio
    bio = get_revised_description(bio)

    Author.find_or_create_by(
      full_name: author_data["personal_name"] || author_data["name"],
      bio_description: bio,
      birth_date: author_data["birth_date"]&.to_s,
      death_date: author_data["death_date"]&.to_s,
      slug: @slug,
      photo_ids: author_data["photos"] || [],
      author_key: author_key
    )
  end
end