class BookSerializer
  include Rails.application.routes.url_helpers

  def initialize(book, edition)
    @book = book
    @edition = edition
  end

  def as_json(*)
    {
      id: @book.id,
      work_id: @book.work_id,
      title: @book.title,
      series: @book.series,
      first_published: @book.first_published,
      setting: @book.setting,
      description: @book.description,
      authors: @book.authors.map { |a| { id: a.id, full_name: a.full_name } },
      contributors: @edition.edition_contributors.map { |c| { id: c.id, name: c.name, role: c.role } },
      genres: @book.genres.map { |g| { id: g.id, name: g.name } },
        editions: @book.editions
          .filter { |e| e.id != @edition.id }
          .map { |e| edition_attributes(e) },
      movies: @book.movies.map { |m| { id: m.id, title: m.title, image_url: image_url(m), release_date: m.release_date } },
      edition: edition_attributes(@edition),
      image_url: image_url(@edition)
    }
  end

  private

  def edition_attributes(edition)
    return nil unless edition
    
    edition.slice(:id, :format, :publication_date, :publisher, :isbn, :language, :description, :asin)
  end

  def image_url(record)
    return nil unless record.image.attached?
    url_for(record.image)
  end
end
