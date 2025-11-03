class BookSerializer
  include Rails.application.routes.url_helpers

  def initialize(book, edition)
    @book = book
    @edition = edition
  end

  def as_json(*)
    {
      id: @book.id,
      title: @book.title,
      year: @book.year,
      setting: @book.setting,
      description: @book.description,
      authors: @book.authors.map { |a| { id: a.id, full_name: a.full_name } },
      genres: @book.genres.map { |g| { id: g.id, name: g.name } },
      editions: @book.editions
        .filter { |e| e.id != @edition.id }
        .map { |e| { id: e.id, format: e.format, publication_date: e.publication_date, publisher: e.publisher, image_url: image_url(e) } },
      edition: edition_attributes,
      image_url: image_url(@edition)
    }
  end

  private

  def edition_attributes
    return nil unless @edition
    
    @edition.slice(:id, :format, :publication_date, :publisher, :isbn, :language, :description, :asin)
  end

  def image_url(edition)
    return nil unless edition.image.attached?
    url_for(edition.image)
  end
end
