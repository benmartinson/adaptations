class BookSerializer
  include Rails.application.routes.url_helpers

  def initialize(book)
    @book = book
  end

  def as_json(*)
    {
      id: @book.id,
      title: @book.title,
      year: @book.year,
      description: @book.description,
      authors: @book.authors.map { |a| { id: a.id, full_name: a.full_name } },
      image_url: image_url
    }
  end

  private

  def image_url
    return nil unless @book.image.attached?
    variant = @book.image.variant(resize_to_limit: [200, 300]).processed
    url_for(variant)
  end
end