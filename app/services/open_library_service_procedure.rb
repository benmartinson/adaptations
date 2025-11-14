class OpenLibraryServiceProcedure
  include OpenLibraryUtils
  require 'active_support/core_ext/string/inflections'

  def get_request_url(request_name, params)
    case request_name
    when "PrimaryEdition"
      if params[:work_id].blank?
        raise "Work ID is required for PrimaryEdition"
      end
      "https://openlibrary.org/works/#{params[:work_id]}/editions.json"
    when "WorkData"
      if params[:work_id].blank?
        raise "Work ID is required for WorkData"
      end
      "https://openlibrary.org/works/#{params[:work_id]}.json"
    when "IsbnEditionData"
      if params[:isbn].blank?
        raise "ISBN is required for IsbnEditionData"
      end
      "https://openlibrary.org/isbn/#{params[:isbn]}.json"
    when "AuthorData"
      if params[:author_key].blank?
        raise "Author key is required for AuthorData"
      end
      "https://openlibrary.org/authors/#{params[:author_key]}.json"
    when "AuthorBooks"
      if params[:author_key].blank?
        raise "Author key is required for AuthorBooks"
      end
      "https://openlibrary.org/authors/#{params[:author_key]}/works.json"
    when "SearchAuthorFromSlug"
      if params[:slug].blank?
        raise "Slug is required for SearchAuthorFromSlug"
      end
      "https://openlibrary.org/search/authors.json?q=#{params[:slug]}&limit=3"
    else
      raise "Unknown request name: #{request_name}"
    end
  end

  def run_request_procedure(request_name, data, params)
    case request_name
    when "PrimaryEdition"
      primary_edition_procedure(data, params)
    when "WorkData"
        work_data_procedure(data, params)
    when "IsbnEditionData"
      isbn_edition_data_procedure(data, params)
    when "AuthorData"
      author_data_procedure(data, params)
    when "AuthorBooks"
      author_books_procedure(data)
    when "SearchAuthorFromSlug"
      search_author_from_slug_procedure(data, params)
    else
      raise "Unknown request name: #{request_name}"
    end
  end

  private

  def primary_edition_procedure(data, params)
    if data["entries"].blank?
      return nil
    end
    all_entries = data["entries"].clone
    valid_entries = data["entries"].filter { |entry|
      entry["publish_date"].present?
      entry["languages"]&.first&.dig("key") == "/languages/eng"
      entry["covers"].present?
      entry["publishers"].present?
      entry["isbn_13"].present?
    }
    valid_entries = valid_entries.length > 0 ? valid_entries : all_entries
    primary_edition = oldest_entry(valid_entries)
    {
      "isbn" => primary_edition["isbn_13"]&.first,
      "publish_date" => primary_edition["publish_date"],
      "language" => language_from_key(primary_edition["languages"]&.first&.dig("key")),
      "format" => get_format(primary_edition),
      "publisher" => primary_edition["publishers"]&.first,
    }
  end

  def work_data_procedure(data, params)
    data["description"] = data["description"].is_a?(Hash) ? data["description"]["value"] : data["description"]
    data["title"] = data["title"].titleize
    data["cover_id"] = data["covers"]&.first || nil
    data["work_id"] = params[:work_id]
    data
  end

  def isbn_edition_data_procedure(data, params)
    work_id = data["works"]&.first&.dig("key") || data["key"]
    if work_id.present?
      work_id = work_id.to_s.gsub(/^\/works\//, "")
    else
      work_id = nil
    end
    data["work_id"] = work_id
    data["title"] = data["title"].titleize
    data["cover_id"] = data["covers"]&.first || nil
    data["series"] = data["series"]&.first
    data["first_published"] = parse_first_published(data["publish_date"])
    data["language"] = language_from_key(data["languages"]&.first&.dig("key"))
    data["format"] = get_format(data)
    data["publication_date"] = normalize_date(data["publish_date"])
    data["publisher"] = data["publishers"]&.first
    data
  end

  def author_books_procedure(data)
    works = data["entries"][0]
    works.filter { |work|
      work["covers"].present? 
    }.map { |work| 
      {
        work_id: work["key"].split("/").last,
        cover_id: work["covers"].first,
        title: work["title"],
      }
    }
  end

  def search_author_from_slug_procedure(data, params)
    author_data = data["docs"].find do |doc|
      doc["author_name"]&.first&.parameterize == @slug
    end
    unless author_data.present?
      raise "Author not found for slug: #{params[:slug]}"
    end
    author_data["author_key"]&.first ||author_data["key"]
  end

  def author_data_procedure(data, params)
    bio = data["bio"]
    bio = bio.is_a?(Hash) ? bio["value"] : bio
    bio = get_revised_description(bio)
    {
      full_name: data["name"],
      bio: bio,
      birth_date: data["birth_date"],
      death_date: data["death_date"],
      photo_ids: data["photos"],
    }
  end
end

