module Api
  class AuthorController < ApplicationController
    def index
      render json: Author.all
    end

    def show
      author = Author.friendly.find(params[:slug])
      render json: author
    end
  end
end