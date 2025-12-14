import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import BookList from "./components/BookList";
import Book from "./components/book/Book";
import Author from "./components/author/Author";
import Navbar from "./components/Navbar";
import TaskRunner from "./components/task/TaskRunner";
import TaskList from "./components/task/TaskList";
import TestPreviewPage from "./components/task/tests/TestPreviewPage";
import LinkRunner from "./components/link/LinkRunner";

const root = createRoot(document.getElementById("react-root"));
root.render(
  <BrowserRouter>
    <Navbar />
    <Routes>
      <Route path="/books" element={<BookList />} />
      <Route path="/books/:isbn" element={<Book />} />
      <Route path="/author/:slug" element={<Author />} />
      <Route path="/tasks" element={<TaskList />} />
      <Route
        path="/task/:task_id"
        element={<Navigate to="endpoint" replace />}
      />
      <Route path="/task/:task_id/:tab" element={<TaskRunner />} />
      <Route
        path="/task/:task_id/tests/preview"
        element={<TestPreviewPage />}
      />
      <Route
        path="/link/:task_id"
        element={<Navigate to="details" replace />}
      />
      <Route
        path="/link/:task_id/tests/preview"
        element={<TestPreviewPage />}
      />
      <Route path="/link/:task_id/:tab" element={<LinkRunner />} />
    </Routes>
  </BrowserRouter>
);
