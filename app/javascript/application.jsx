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
import ListLinkRunner from "./components/list-link/ListLinkRunner";
import AppRunner from "./components/app/AppRunner";
import AppsList from "./components/app/AppsList";
import { UserProvider } from "./components/UserContext";

// Expose React globally so remotely-bundled components can share the same React instance.
if (typeof window !== "undefined") {
  window.React = React;
}

const root = createRoot(document.getElementById("react-root"));
root.render(
  <BrowserRouter>
    <UserProvider>
      <Navbar />
      <Routes>
        {/* <Route path="/books" element={<BookList />} />
        <Route path="/books/:isbn" element={<Book />} />
        <Route path="/author/:slug" element={<Author />} /> */}
        <Route path="/apps" element={<AppsList />} />
        <Route path="/:app_id/processes" element={<TaskList />} />
        <Route
          path="/:app_id/process/:task_id"
          element={<Navigate to="endpoint" replace />}
        />
        <Route path="/:app_id/process/:task_id/:tab" element={<TaskRunner />} />
        <Route
          path="/:app_id/process/:task_id/tests/preview"
          element={<TestPreviewPage />}
        />
        <Route
          path="/:app_id/link/:task_id"
          element={<Navigate to="details" replace />}
        />
        <Route
          path="/:app_id/link/:task_id/tests/preview"
          element={<TestPreviewPage />}
        />
        <Route path="/:app_id/link/:task_id/:tab" element={<LinkRunner />} />
        <Route
          path="/:app_id/list-link/:task_id"
          element={<Navigate to="details" replace />}
        />
        <Route
          path="/:app_id/list-link/:task_id/:tab"
          element={<ListLinkRunner />}
        />
        <Route path="/:app_id/app/:system_tag" element={<AppRunner />} />
      </Routes>
    </UserProvider>
  </BrowserRouter>
);
