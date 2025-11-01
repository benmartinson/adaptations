class Book < ApplicationRecord
  has_many :author_books
  has_many :authors, through: :author_books
  has_one_attached :image
  has_many :book_genres
  has_many :genres, through: :book_genres
end
