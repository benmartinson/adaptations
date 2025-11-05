import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BookAuthors from "./BookAuthors";
import PageFrame from "../PageFrame";
import BookGenres from "./BookGenres";
import BookEditions from "./BookEditions";
import moment from "moment";
import MoviesBasedOn from "./MoviesBasedOn";

export default function Book() {
  const { isbn } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [imageError, setImageError] = useState(false);
  const edition = book?.edition;
  console.log({ book, edition });

  useEffect(() => {
    const url = `/api/books/${isbn}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setBook(data);
        setImageError(false);
      });
  }, [navigate]);

  if (!book) return <p>Loading...</p>;

  const labelValue = (label, value) => {
    return (
      <div className="flex text-[14px] leading-[18px] font-body mt-2">
        <p className="w-[125px]">{label}</p>
        <p className="">{value}</p>
      </div>
    );
  };

  return (
    <PageFrame>
      <div className="col-span-3 self-start sticky top-20">
        {edition.isbn && (
          <>
            {!imageError ? (
              <img
                src={`https://covers.openlibrary.org/b/isbn/${edition.isbn}-L.jpg?default=false`}
                alt={book.title}
                className="w-[210px] h-[320px] m-auto [border-radius:0_6%_6%_0_/4%] drop-shadow-md"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-[210px] h-[320px] m-auto [border-radius:0_6%_6%_0_/4%] drop-shadow-md bg-gray-200 flex items-center justify-center border-2 border-dashed border-gray-400">
                <div className="text-center text-gray-500">
                  <svg
                    className="w-16 h-16 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm">Image not available</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <div className="col-span-9">
        <h1 className="font-fancy text-[36px] leading-[46px] font-[600]">
          {book.title}
        </h1>
        <BookAuthors authors={book.authors} contributors={book.contributors} />
        <div className="font-body grid grid-cols-9 gap-6 mt-3">
          <div className="col-span-7">
            <p>{edition.description || book.description}</p>
          </div>
        </div>
        <BookGenres genres={book.genres} />
        <div className="mt-3 text-[#707070] text-[14px] leading-[18px] font-body">
          <div className="">{edition.format}</div>
          <div className="mt-2">First published {book.year}</div>
        </div>
        <div className="text-[#707070] mt-3">
          {labelValue("Original Title", book.title)}
          {labelValue("Setting", book.setting)}
        </div>
        {/* <MoviesBasedOn movies={book.movies} /> */}
        <h4 className="font-fancy text-[14px] leading-[20px] font-[600] font-bold mt-6">
          This edition
        </h4>
        <div className="text-[#707070] mt-3">
          {labelValue("Format", edition.format)}
          {labelValue(
            "Published",
            `${moment(edition.publication_date).format("MMMM D, YYYY")} by ${
              edition.publisher
            }`
          )}
          {labelValue("ISBN", edition.isbn)}
          {labelValue("Language", edition.language)}
        </div>
        <BookEditions editions={book.editions} />
      </div>
    </PageFrame>
  );
}
