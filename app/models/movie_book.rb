class MovieBook < ApplicationRecord
  belongs_to :movie
  belongs_to :book
end
