class BookSerializer
  include Rails.application.routes.url_helpers

  def initialize(book)
    @book = book
    @primary_edition = book.primary_edition
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
        .filter { |e| e.primary_edition == 0 }
        .map { |e| { id: e.id, format: e.format, publication_date: e.publication_date, publisher: e.publisher, image_url: image_url(e) } },
      primary_edition: primary_edition_attributes,
      image_url: image_url(@primary_edition)
    }
  end

  private

  def primary_edition_attributes
    return nil unless @primary_edition
    
    @primary_edition.slice(:id, :format, :publication_date, :publisher, :isbn, :language, :description, :asin)
  end

  def image_url(edition)
    return nil unless edition.image.attached?
    url_for(edition.image)
  end
end
