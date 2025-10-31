class Book < ApplicationRecord
  has_many :author_books
  has_many :authors, through: :author_books
  has_one_attached :image

  def image_url
    return nil unless image.attached?
    image.variant(resize_to_limit: [800, 800])
  end
end
