import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import useTaskProgress from "../../../hooks/useTaskProgress";

export default function ListLinksTab({
  taskId,
  parentSystemTag,
  responseJson,
}) {
  const navigate = useNavigate();
  const [listLinks, setListLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadListLinks();
  }, [taskId]);

  const loadListLinks = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/list_links`);
      if (response.ok) {
        const data = await response.json();
        setListLinks(data);
      }
    } catch (error) {
      console.error("Failed to load list links:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateListLink = async () => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: {
            kind: "list_link_connector",
            system_tag: parentSystemTag,
            metadata: { parent_task_id: taskId },
          },
        }),
      });

      if (response.ok) {
        const task = await response.json();
        navigate(`/list-link/${task.id}/details`);
      } else {
        const error = await response.json();
        alert(`Failed to create link: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to create link:", error);
      alert("Failed to create link");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteListLink = async (e, linkId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this list link?")) return;

    try {
      const response = await fetch(`/api/tasks/${linkId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setListLinks(listLinks.filter((link) => link.id !== linkId));
      } else {
        alert("Failed to delete list link");
      }
    } catch (error) {
      console.error("Failed to delete list link:", error);
      alert("Failed to delete list link");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading list links...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">List Links</h3>
          <p className="text-sm text-gray-500">
            Configure links for list items to navigate to detail pages
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreateListLink}
          disabled={isCreating}
          className="px-3 py-1.5 text-sm font-medium rounded-md bg-gray-800 text-white hover:bg-gray-900 cursor-pointer transition-colors flex items-center gap-1.5"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          {isCreating ? "Creating..." : "Create Link Connection"}
        </button>
      </div>

      {/* List of existing links */}
      <div className="space-y-2">
        {listLinks.map((link) => (
          <Link
            key={link.id}
            to={`/list-link/${link.id}/details`}
            className="block bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <code className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm font-medium">
                  → {link.to_system_tag || "Unconfigured"}
                </code>
                {link.transform_code && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                    Configured
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => handleDeleteListLink(e, link.id)}
                  className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="Delete"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
                <svg
                  className="w-5 h-5 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </Link>
        ))}

        {/* Empty state */}
        {listLinks.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <div className="text-gray-400 mb-2">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">
              No list links configured
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Create a link connection to enable navigation from list items to
              detail pages.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
