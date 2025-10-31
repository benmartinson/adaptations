import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import BookAuthors from "./BookAuthors";

export default function Book() {
  const { id } = useParams();
  const [book, setBook] = useState(null);

  useEffect(() => {
    fetch(`/api/books/${id}`)
      .then(res => res.json())
      .then(data => setBook(data));
  }, [id]);

  if (!book) return <p>Loading...</p>;

  return (
    <div>
      <h1>{book.title}</h1>
      <BookAuthors authors={book.authors}/>
      <p><strong>Year:</strong> {book.year}</p>
      <p>{book.description}</p>
    </div>
  );
}
