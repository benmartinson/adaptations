class Author < ApplicationRecord
  extend FriendlyId
  friendly_id :full_name, use: :slugged

  has_many :author_books, dependent: :destroy
  has_many :books, through: :author_books
  has_many :contributors
  has_many :editions, through: :contributors

  def photo_ids
    super || []
  end
end
