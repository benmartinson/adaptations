import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function Author() {
  const { slug } = useParams();
  const [author, setAuthor] = useState(null);

  useEffect(() => {
    const url = `/api/authors/${slug}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => setAuthor(data));
  }, [slug]);

  if (!author) return <p>Loading...</p>;
  return <div>{author.full_name}</div>;
}
