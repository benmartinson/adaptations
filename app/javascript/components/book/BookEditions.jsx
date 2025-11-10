import React, { useEffect, useState } from "react";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import HorizontalCardList from "../common/HorizontalCardList";

export default function BookEditions({
  work_id,
  initialEditions,
  currentEditionIsbn,
}) {
  const navigate = useNavigate();
  const [editions, setEditions] = useState(initialEditions);

  useEffect(() => {
    const url = `/api/books/${work_id}/editions`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setEditions(data);
      });
  }, []);

  const filteredEditions = editions
    .filter((edition) => edition.isbn !== currentEditionIsbn)
    .map((edition) => ({
      id: edition.id,
      isbn: edition.isbn,
      imageUrl: edition.isbn
        ? `https://covers.openlibrary.org/b/isbn/${edition.isbn}-L.jpg?default=false`
        : null,
      firstLineText: edition.format?.split(",").last,
      secondLineText: edition.publisher,
      thirdLineText: moment(edition.publication_date).format("YYYY"),
    }));

  const handleItemClick = (item) => {
    if (item.isbn) {
      navigate(`/books/${item.isbn}`);
    }
  };

  return (
    <HorizontalCardList
      title="More editions"
      items={filteredEditions}
      onItemClick={handleItemClick}
    />
  );
}
