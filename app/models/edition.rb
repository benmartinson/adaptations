class Edition < ApplicationRecord
  belongs_to :book
  has_many :contributors
  has_many :authors, through: :contributors
  has_one_attached :image
end
