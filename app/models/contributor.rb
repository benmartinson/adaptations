class Contributor < ApplicationRecord
  belongs_to :author
  belongs_to :edition
end
