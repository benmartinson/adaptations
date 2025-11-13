class OpenLibraryServiceProcedure
  def get_request_url(request_name, params)
    case request_name
    when "AuthorBooks"
      if params[:author_key].blank?
        raise "Author key is required"
      end
      "https://openlibrary.org/authors/#{params[:author_key]}/works.json"
    else
      raise "Unknown request name: #{request_name}"
    end
  end

  def run_request_procedure(request_name, data)
    case request_name
    when "AuthorBooks"
      author_books_procedure(data)
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
end

