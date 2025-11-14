
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
    author = Author.find_by(author_key: @author_key)

    prompt = "Of these books, can you select the best options, prioritizing english versions? Here is the list of choices: #{books}"
    chat = GeminiChat.new
    reply = chat.generate_response(prompt)
    books = books.select do |book| 
      reply.include?(book[:title]) || reply.include?(book[:work_id]) 
    end
    
    imported_books = books.map do |work_data|
      book = Book.find_by(work_id: work_data[:work_id])
      book_id = book.id if book.present?
      next if book.present? && book.authors.find_by(author_key: @author_key).present? && book.editions.any?

      edition_data = service_procedure.run_service("PrimaryEdition", {work_id: work_data[:work_id]}) 
      next if edition_data.blank?
      if edition_data && edition_data["isbn"].present?
        importer = BookImporter.new(edition_data["isbn"])
        result = importer.import
        book = result[:book]
        edition = result[:edition]
        author.books << book unless author.books.include?(book)
        { book: book, edition: edition }
      end
    end.filter { |result| result.present? }
    imported_books
  end
end