import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BookAuthors from "./BookAuthors";
import PageFrame from "../PageFrame";
import BookGenres from "./BookGenres";
import BookEditions from "./BookEditions";
import moment from "moment";
import Label from "../common/Label";
import ImageNotFound from "../common/ImageNotFound";

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

  let imageUrl = null;
  if (edition.cover_id) {
    imageUrl = `https://covers.openlibrary.org/b/id/${edition.cover_id}-L.jpg`;
  } else if (edition.isbn) {
    imageUrl = `https://covers.openlibrary.org/b/isbn/${edition.isbn}-L.jpg`;
  } else if (book.cover_id) {
    imageUrl = `https://covers.openlibrary.org/b/id/${book.cover_id}-L.jpg`;
  }

  return (
    <PageFrame>
      <div className="col-span-3 self-start sticky top-20">
        {edition.isbn && (
          <>
            {!imageError ? (
              <img
                src={imageUrl}
                alt={book.title}
                className="w-[210px] h-[320px] m-auto [border-radius:0_6%_6%_0_/4%] drop-shadow-md"
                onError={() => setImageError(true)}
              />
            ) : (
              <ImageNotFound />
            )}
          </>
        )}
      </div>
      <div className="col-span-9">
        {book.series && (
          <div className="font-fancy italic text-[20px] leading-[28px] text-[#707070] mb-2">
            {book.series}
          </div>
        )}
        <h1 className="font-fancy text-[36px] leading-[46px] font-[600]">
          {book.title}
        </h1>
        <BookAuthors authors={book.authors} contributors={book.contributors} />
        <div className="font-body grid grid-cols-9 gap-6 mt-3 max-h-[200px] overflow-y-auto">
          <div className="col-span-7">
            <p>{edition.description || book.description}</p>
          </div>
        </div>
        <BookGenres genres={book.genres} />
        {/* <div className="mt-3 text-[#707070] text-[14px] leading-[18px] font-body">
          <div className="">{edition.format}</div>
          <div className="mt-2">First published {book.first_published}</div>
        </div>
        <div className="text-[#707070] mt-3">
          {labelValue("Original Title", book.title)}
          {labelValue("Setting", book.setting)}
        </div> */}
        <h4 className="font-fancy text-[14px] leading-[20px] font-[600] font-bold mt-6">
          This edition
        </h4>
        <div className="mt-3">
          <Label label="Format" value={edition.format} />
          <Label
            label="Published"
            value={`${moment(edition.publication_date).format(
              "MMMM D, YYYY"
            )} by ${edition.publisher}`}
          />
          <Label label="ISBN" value={edition.isbn} />
          <Label label="Language" value={edition.language} />
        </div>
        <BookEditions
          work_id={book.work_id}
          initialEditions={book.editions}
          currentEditionIsbn={edition.isbn}
        />
      </div>
    </PageFrame>
  );
}
