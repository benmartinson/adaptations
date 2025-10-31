class Book < ApplicationRecord
  include ActiveModel::Model
  include ActiveModel::Attributes

  attribute :title, :string
  attribute :year, :integer
  attribute :description, :string

  has_many :author_books
  has_many :authors, through: :author_books
end
