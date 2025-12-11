import React, { useEffect, useState } from "react";
import VerticalCardList from "../common/VerticalCardList";
import moment from "moment";
import { useNavigate } from "react-router-dom";

export default function AuthorBooks({ slug }) {
  const [books, setBooks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const url = `/api/authors/${slug}/books`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => setBooks(data));
  }, [slug]);

  const bookItems = books.map((book) => {
    let primaryEdition = book.editions?.length > 0 ? book.editions[0] : null;
    let imageUrl = null;
    if (book.cover_id) {
      imageUrl = `https://covers.openlibrary.org/b/id/${book.cover_id}-L.jpg`;
    } else if (primaryEdition.cover_id) {
      imageUrl = `https://covers.openlibrary.org/b/id/${primaryEdition.cover_id}-L.jpg`;
    } else if (primaryEdition.isbn) {
      imageUrl = `https://covers.openlibrary.org/b/isbn/${primaryEdition.isbn}-L.jpg`;
    }
    return {
      id: book.work_id,
      primaryEdition: primaryEdition,
      imageUrl: imageUrl,
      firstLineText: book.title,
      secondLineText: `Published ${
        moment(primaryEdition.publication_date).format("YYYY") || "-"
      }`,
      // thirdLineText: primaryEdition.publisher,
    };
  });

  return (
    <VerticalCardList
      title="Books by this author"
      items={bookItems}
      onItemClick={(item) => navigate(`/books/${item.primaryEdition.isbn}`)}
    />
  );
}
