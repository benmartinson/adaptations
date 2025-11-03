import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import BookList from "./components/BookList";
import Book from "./components/book/Book";
import Navbar from "./components/Navbar";

const root = createRoot(document.getElementById("react-root"));
root.render(
  <BrowserRouter>
    <Navbar />
    <Routes>
      <Route path="/books" element={<BookList />} />
      <Route path="/books/:work_id/edition/:edition_id" element={<Book />} />
      <Route path="/books/:work_id" element={<Book />} />
    </Routes>
  </BrowserRouter>
);
