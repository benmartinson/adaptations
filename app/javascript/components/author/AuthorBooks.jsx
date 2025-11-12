import React, { useEffect, useState } from "react";

export default function AuthorBooks({ slug }) {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    const url = `/api/authors/${slug}/books`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => setBooks(data));
  }, [slug]);

  return <div></div>;
}
