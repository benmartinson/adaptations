import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import BookAuthors from "./BookAuthors";
import PageFrame from "./PageFrame";

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
      {book.image_url && (
        <img
          src={book.image_url}
          alt={book.title}
          className="w-full max-w-md mb-4 rounded-lg shadow-lg"
        />
      )}
      <h1 className="text-2xl font-bold text-blue-600">{book.title}</h1>
      <div className="flex flex-col items-center border-2 border-red-500">
        <BookAuthors authors={book.authors} />
      </div>
      <p>
        <strong>Year:</strong> {book.year}
      </p>
      <p>{book.description}</p>
    </PageFrame>
  );
}
