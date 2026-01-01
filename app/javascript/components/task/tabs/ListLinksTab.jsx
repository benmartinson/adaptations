import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import useTaskProgress from "../../../hooks/useTaskProgress";

export default function ListLinksTab({
  taskId,
  parentSystemTag,
  responseJson,
}) {
  const navigate = useNavigate();
  const { snapshot } = useTaskProgress(taskId);
  const [listLinks, setListLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isAttaching, setIsAttaching] = useState(false);

  const isAttachingLinks =
    isAttaching || snapshot?.phase === "link_attachment_generation";

  useEffect(() => {
    loadListLinks();
  }, [taskId]);

  // Reset isAttaching when job completes
  useEffect(() => {
    if (snapshot?.phase === "completed-link-attachment") {
      setIsAttaching(false);
    }
  }, [snapshot?.phase]);

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
        navigate(`/1/list-link/${task.id}/details`);
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

  const handleAttachLinks = async () => {
    setIsAttaching(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/attach_links`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Failed to attach links: ${error.error || "Unknown error"}`);
        setIsAttaching(false);
      }
      // Job started successfully, isAttaching will be reset when job completes via snapshot
    } catch (error) {
      console.error("Failed to attach links:", error);
      alert("Failed to attach links");
      setIsAttaching(false);
    }
  };

  const handleSetActiveLink = async (e, linkId) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("Setting active link:", linkId);
    try {
      const response = await fetch(`/api/tasks/${taskId}/set_active_link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ link_id: linkId }),
      });

      if (response.ok) {
        const updatedLinks = await response.json();
        setListLinks(updatedLinks);
      } else {
        const error = await response.json();
        alert(`Failed to set active link: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to set active link:", error);
      alert("Failed to set active link");
    }
  };

  // Check if there is an active configured link available for attachment
  const hasActiveConfiguredLink = listLinks.some(
    (link) => link.is_active && link.transform_code && link.to_system_tag
  );

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
        <div className="flex items-center gap-3">
          {isAttachingLinks && (
            <span className="text-sm text-gray-600 font-medium animate-pulse">
              Attaching links to UI...
            </span>
          )}
          <button
            type="button"
            onClick={handleAttachLinks}
            disabled={isAttachingLinks || !hasActiveConfiguredLink}
            title={
              !hasActiveConfiguredLink
                ? "Select and configure an active link connection first"
                : ""
            }
            className="px-3 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center gap-1.5"
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
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            {isAttachingLinks ? "Attaching..." : "Attach Links"}
          </button>
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
      </div>

      {/* List of existing links */}
      <div className="space-y-2">
        {listLinks.map((link) => (
          <div
            key={link.id}
            className={`bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow group border-gray-200`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Radio button for active selection */}
                <button
                  type="button"
                  onClick={(e) => handleSetActiveLink(e, link.id)}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer ${
                    link.is_active
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300 hover:border-blue-400"
                  }`}
                  title={link.is_active ? "Active link" : "Set as active link"}
                >
                  {link.is_active && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </button>
                <Link
                  to={`/list-link/${link.id}/details`}
                  className="flex items-center gap-3 hover:underline"
                >
                  <code className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm font-medium">
                    → {link.to_system_tag || "Unconfigured"}
                  </code>
                </Link>
                {link.transform_code && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                    Configured
                  </span>
                )}
                {link.is_active && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-medium">
                    Active
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
                <Link to={`/list-link/${link.id}/details`} className="p-1.5">
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
                </Link>
              </div>
            </div>
          </div>
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
