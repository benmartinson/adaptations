import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"

export default function BookList() {
  const [books, setBooks] = useState([])

  useEffect(() => {
    fetch(`/api/books`)
      .then(res => res.json())
      .then(data => setBooks(data));
  }, []);


  return (
    <div>
      <h2>Books</h2>
      <ul>
        {books.map(book => (
          <li key={book.id}>
            <Link to={`/books/${book.id}`}>{book.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
