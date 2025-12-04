import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import BookList from "./components/BookList";
import Book from "./components/book/Book";
import Author from "./components/author/Author";
import Navbar from "./components/Navbar";
import TryApi from "./components/api/TryApi";
import TaskRunner from "./components/task/TaskRunner";
import TaskList from "./components/task/TaskList";
import TestPreviewPage from "./components/task/tests/TestPreviewPage";

const root = createRoot(document.getElementById("react-root"));
root.render(
  <BrowserRouter>
    <Navbar />
    <Routes>
      <Route path="/books" element={<BookList />} />
      <Route path="/books/:isbn" element={<Book />} />
      <Route path="/author/:slug" element={<Author />} />
      <Route path="/try_api" element={<TryApi />} />
      <Route path="/tasks" element={<TaskList />} />
      <Route path="/task/:task_id" element={<TaskRunner />} />
      <Route
        path="/task/:task_id/test/:test_id/preview"
        element={<TestPreviewPage />}
      />
    </Routes>
  </BrowserRouter>
);
