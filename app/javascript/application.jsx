import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import BookList from "./components/BookList";
import Book from "./components/book/Book";

const root = createRoot(document.getElementById("react-root"));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/books" element={<BookList />} />
      <Route path="/books/:id" element={<Book />} />
    </Routes>
  </BrowserRouter>
);
