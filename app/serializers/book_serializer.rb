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
      genres: @book.genres.map { |g| { id: g.id, name: g.name } },
      image_url: image_url
    }
  end

  private

  def image_url
    return nil unless @book.image.attached?
    url_for(@book.image)
  end
end