class Book < ApplicationRecord
  has_many :author_books, dependent: :destroy
  has_many :authors, through: :author_books
  has_many :book_genres, dependent: :destroy
  has_many :genres, through: :book_genres
  has_many :editions, dependent: :destroy
  has_many :movie_books, dependent: :destroy
  has_many :movies, through: :movie_books
  has_one :primary_edition, -> { where(primary_edition: 1) }, class_name: "Edition"
end

