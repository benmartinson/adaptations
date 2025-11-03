class Author < ApplicationRecord
  include ActiveModel::Model
  include ActiveModel::Attributes

  attribute :full_name, :string
  attribute :birth_year, :integer 
  attribute :death_year, :integer
  attribute :birth_country, :string 
  attribute :bio_description, :string 

  has_many :author_books
  has_many :books, through: :author_books
  has_many :contributors
  has_many :editions, through: :contributors
end
