module Api
  class AuthorController < ApplicationController
    def index
      render json: Author.all
    end

    def show
      begin
        author = Author.friendly.find(params[:slug])
        render json: author
      rescue ActiveRecord::RecordNotFound
        begin
          importer = OpenLibraryAuthorImporter.new(slug: params[:slug])
          author = importer.import
          render json: author
        rescue OpenLibraryAuthorImporter::ImportError => e
          render json: { error: e.message }, status: :not_found
        rescue StandardError => e
          render json: { error: "Failed to import author: #{e.message}" }, status: :internal_server_error
        end
      end
    end

    def books
      author = Author.friendly.find(params[:slug])
      author_key = author.author_key
      raise "Author key not found" unless author_key.present?

      books = author.books.includes(:authors, :genres, :movies).first(3)
      if books.any? && books.length > 1
        render json: books
      else
        importer = OpenLibraryAuthorBooksImporter.new(author_key)
        books = importer.import
        prompt = "Of these books by #{author.full_name}, which are the top 4-5 books that are most popular and would look best shown on a list of books by this author? 
        Prioritize english version. DO NOT mention more than 5 books. DO NOT give alternative choices, only the best 5 or less. DO NOT include a series book collection even if its an option.
         Here is the list of choices: #{books}"
        chat = GeminiChat.new
        reply = chat.generate_response(prompt)
        books = books.select do |book| 
          reply.include?(book[:title]) || reply.include?(book[:work_id]) 
        end
        render json: books
      end
    end
  end

end
