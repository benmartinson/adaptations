import React, { useEffect, useState } from "react";
import VerticalCardList from "../common/VerticalCardList";

export default function AuthorBooks({ slug }) {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    const url = `/api/authors/${slug}/books`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => setBooks(data));
  }, [slug]);

  return (
    <VerticalCardList
      title="Books by this author"
      items={books.map((book) => ({
        id: book.work_id,
        imageUrl: `https://covers.openlibrary.org/b/id/${book.cover_id}-L.jpg`,
        firstLineText: book.title,
        secondLineText: `Published in ${book.first_published || "-"}`,
      }))}
      onItemClick={(item) => navigate(`/books/${item.work_id}`)}
    />
  );
}
