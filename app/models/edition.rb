class Edition < ApplicationRecord
  belongs_to :book
  has_one_attached :image
end
