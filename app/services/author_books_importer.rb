
class AuthorBooksImporter
  include OpenLibraryUtils
  class ImportError < StandardError; end

  def initialize(author_key, author_full_name)
    @author_key = author_key
    @author_full_name = author_full_name
  end

  def import
    service_procedure = ServiceProcedure.new("OpenLibrary")
    books = service_procedure.run_service("AuthorBooks", {author_key: @author_key})

    prompt = "Of these books by #{@author_full_name}, which are the top 4-5 books that are most popular and would look best shown on a list of books by this author? 
      Prioritize english version. DO NOT mention more than 5 books. DO NOT give alternative choices, only the best 5 or less. DO NOT include a series book collection even if its an option.
      Here is the list of choices: #{books}"
    chat = GeminiChat.new
    reply = chat.generate_response(prompt)
    books = books.select do |book| 
      reply.include?(book[:title]) || reply.include?(book[:work_id]) 
    end
    books
  end
end