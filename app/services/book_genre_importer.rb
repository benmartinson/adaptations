class BookGenreImporter
  include OpenLibraryUtils
  class ImportError < StandardError; end

  def initialize(work_id)
    @work_id = work_id
    @service_procedure = ServiceProcedure.new("OpenLibrary")
  end

  def import()
    work_data = @service_procedure.run_service("WorkData", {work_id: @work_id})
    subjects = work_data["subjects"] || []
    book = Book.find_by(work_id: @work_id)
    genres = get_priority_genres(subjects)
    # If there are no matching priority genres, use the subjects as genres
    if genres.empty?
      genres = subjects.map { |subject| subject.split(" ").map(&:capitalize).join(" ") }
    end
    genres.each do |genre_name|
      genre = Genre.find_or_create_by(name: genre_name)
      book.genres << genre unless book.genres.include?(genre)
    end
  end
end
