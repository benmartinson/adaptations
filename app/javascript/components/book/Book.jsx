import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BookAuthors from "./BookAuthors";
import PageFrame from "../PageFrame";
import BookGenres from "./BookGenres";
import BookEditions from "./BookEditions";

export default function Book() {
  const { work_id: workId, edition_id: editionId } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const edition = book?.edition;

  useEffect(() => {
    const url = editionId
      ? `/api/books/${workId}/edition/${editionId}`
      : `/api/books/${workId}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setBook(data);
        // If no edition_id was in the URL but we got an edition, update the URL
        if (!editionId && data.edition?.id) {
          navigate(`/books/${workId}/edition/${data.edition.id}`, {
            replace: true,
          });
        }
      });
  }, [workId, editionId, navigate]);

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
        {book.image_url && (
          <img
            src={book.image_url}
            alt={book.title}
            className="w-[210px] h-[320px] m-auto [border-radius:0_6%_6%_0_/4%] drop-shadow-md"
          />
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
        <h4 className="font-fancy text-[14px] leading-[20px] font-[600] font-bold mt-6">
          This edition
        </h4>
        <div className="text-[#707070] mt-3">
          {labelValue("Format", edition.format)}
          {labelValue(
            "Published",
            `${edition.publication_date} by ${edition.publisher}`
          )}
          {labelValue("ISBN", edition.isbn)}
          {labelValue("ASIN", edition.asin)}
          {labelValue("Language", edition.language)}
        </div>
        <BookEditions editions={book.editions} />
      </div>
    </PageFrame>
  );
}
