import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import BookAuthors from "./BookAuthors";
import PageFrame from "../PageFrame";
import BookGenres from "./BookGenres";

export default function Book() {
  const { id } = useParams();
  const [book, setBook] = useState(null);

  useEffect(() => {
    fetch(`/api/books/${id}`)
      .then((res) => res.json())
      .then((data) => setBook(data));
  }, [id]);

  if (!book) return <p>Loading...</p>;

  return (
    <PageFrame>
      <div className="col-span-3 self-start sticky top-10 ">
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
        <BookAuthors authors={book.authors} />
        <div className="font-body grid grid-cols-9 gap-6 mt-3">
          <div className="col-span-7">
            <p>{book.description}</p>
          </div>
        </div>
        <BookGenres genres={book.genres} />
      </div>
    </PageFrame>
  );
}
