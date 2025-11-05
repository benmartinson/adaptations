# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2025_11_04_174406) do
  create_table "active_storage_attachments", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "record_id", null: false
    t.string "record_type", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "author_books", force: :cascade do |t|
    t.integer "author_id", null: false
    t.integer "book_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["author_id"], name: "index_author_books_on_author_id"
    t.index ["book_id"], name: "index_author_books_on_book_id"
  end

  create_table "authors", force: :cascade do |t|
    t.string "bio_description"
    t.string "birth_country"
    t.integer "birth_year"
    t.datetime "created_at", null: false
    t.integer "death_year"
    t.string "full_name"
    t.datetime "updated_at", null: false
  end

  create_table "book_genres", force: :cascade do |t|
    t.integer "book_id", null: false
    t.datetime "created_at", null: false
    t.integer "genre_id", null: false
    t.datetime "updated_at", null: false
    t.index ["book_id"], name: "index_book_genres_on_book_id"
    t.index ["genre_id"], name: "index_book_genres_on_genre_id"
  end

  create_table "books", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.string "setting"
    t.string "title"
    t.datetime "updated_at", null: false
    t.string "work_id"
    t.integer "year"
    t.index ["work_id"], name: "index_books_on_work_id", unique: true
  end

  create_table "contributors", force: :cascade do |t|
    t.integer "author_id", null: false
    t.datetime "created_at", null: false
    t.integer "edition_id", null: false
    t.string "role_description"
    t.datetime "updated_at", null: false
    t.index ["author_id"], name: "index_contributors_on_author_id"
    t.index ["edition_id"], name: "index_contributors_on_edition_id"
  end

  create_table "editions", force: :cascade do |t|
    t.string "asin"
    t.integer "book_id", null: false
    t.datetime "created_at", null: false
    t.string "description"
    t.string "format"
    t.string "isbn"
    t.string "language"
    t.integer "primary_edition"
    t.date "publication_date"
    t.string "publisher"
    t.datetime "updated_at", null: false
    t.index ["book_id"], name: "index_editions_on_book_id"
  end

  create_table "genres", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "description"
    t.string "name"
    t.datetime "updated_at", null: false
  end

  create_table "movie_books", force: :cascade do |t|
    t.integer "book_id", null: false
    t.datetime "created_at", null: false
    t.integer "movie_id", null: false
    t.datetime "updated_at", null: false
    t.index ["book_id"], name: "index_movie_books_on_book_id"
    t.index ["movie_id"], name: "index_movie_books_on_movie_id"
  end

  create_table "movies", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "rating"
    t.date "release_date"
    t.integer "runtime"
    t.string "synopsis"
    t.string "title"
    t.datetime "updated_at", null: false
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "author_books", "authors"
  add_foreign_key "author_books", "books"
  add_foreign_key "book_genres", "books"
  add_foreign_key "book_genres", "genres"
  add_foreign_key "contributors", "authors"
  add_foreign_key "contributors", "editions"
  add_foreign_key "editions", "books"
  add_foreign_key "movie_books", "books"
  add_foreign_key "movie_books", "movies"
end
