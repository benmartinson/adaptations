class Author < ApplicationRecord
  include ActiveModel::Model
  include ActiveModel::Attributes

  attribute :full_name, :string
  attribute :birth_date, :string 
  attribute :death_date, :string
  attribute :birth_country, :string 
  attribute :bio_description, :string 

  has_many :author_books
  has_many :books, through: :author_books
  has_many :contributors
  has_many :editions, through: :contributors
end
