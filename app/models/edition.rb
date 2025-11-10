class Edition < ApplicationRecord
  belongs_to :book
  has_many :edition_contributors, dependent: :destroy
  has_one_attached :image
end
