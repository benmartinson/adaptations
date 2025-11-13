class OpenLibraryServiceProcedure
  include OpenLibraryUtils

  def get_request_url(request_name, params)
    case request_name
    when "AuthorData"
      if params[:author_key].blank?
        raise "Author key is required"
      end
      "https://openlibrary.org/authors/#{params[:author_key]}.json"
    when "AuthorBooks"
      if params[:author_key].blank?
        raise "Author key is required"
      end
      "https://openlibrary.org/authors/#{params[:author_key]}/works.json"
    when "SearchAuthorFromSlug"
      if params[:slug].blank?
        raise "Slug is required"
      end
      "https://openlibrary.org/search/authors.json?q=#{params[:slug]}&limit=3"
    else
      raise "Unknown request name: #{request_name}"
    end
  end

  def run_request_procedure(request_name, data, params)
    case request_name
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

  def author_books_procedure(data)
    works = data["entries"]
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
    author_data["author_key"].first
  end

  def author_data_procedure(data, params)
    bio = data["bio"]
    bio = bio.is_a?(Hash) ? bio["value"] : bio
    bio = get_revised_description(bio)
    {
      author_key: data["author_key"].first,
      full_name: data["author_name"].first,
      bio: bio,
      birth_date: data["birth_date"].first,
      death_date: data["death_date"].first,
      photo_ids: data["photos"].first,
    }
  end
end

