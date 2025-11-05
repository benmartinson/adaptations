class Movie < ApplicationRecord
  has_many :movie_books
  has_many :books, through: :movie_books
  has_one_attached :image
end
