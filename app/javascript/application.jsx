import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import BookList from "./components/BookList";
import Book from "./components/book/Book";
import Author from "./components/author/Author";
import Navbar from "./components/Navbar";
import TryApi from "./components/api/TryApi";

const root = createRoot(document.getElementById("react-root"));
root.render(
  <BrowserRouter>
    <Navbar />
    <Routes>
      <Route path="/books" element={<BookList />} />
      <Route path="/books/:isbn" element={<Book />} />
      <Route path="/author/:slug" element={<Author />} />
      <Route path="/try_api" element={<TryApi />} />
    </Routes>
  </BrowserRouter>
);
