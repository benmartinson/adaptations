class Author < ApplicationRecord
  has_many :author_books, dependent: :destroy
  has_many :books, through: :author_books
  has_many :contributors
  has_many :editions, through: :contributors
end
