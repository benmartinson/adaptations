import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import moment from "moment";
import Modal from "../common/Modal";

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [showNewProcessModal, setShowNewProcessModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      setLoading(true);
      const response = await fetch("/api/tasks?limit=50");
      if (!response.ok) {
        throw new Error("Unable to load tasks");
      }
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTask(kind) {
    setCreating(true);
    setShowNewProcessModal(false);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: {
            kind,
            metadata: { source: "web-ui" },
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to create task");
      }

      const task = await response.json();
      const route = kind === "link" ? `/link/${task.id}` : `/task/${task.id}`;
      navigate(route);
    } catch (error) {
      console.error(error);
      setError(error.message);
      setCreating(false);
    }
  }

  async function handleDeleteTask(e, taskId) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this process?")) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Unable to delete task");
      }

      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (error) {
      console.error(error);
      setError(error.message);
    }
  }

  function getKindColor(kind) {
    switch (kind) {
      case "link":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "api_transform":
        return "bg-green-100 text-green-800 border-green-200";
    }
  }
  function getStatusColor(status) {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "running":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  }

  function formatDate(dateString) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center text-gray-500">Loading tasks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-sm text-red-700 rounded-xl px-4 py-3">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Processes</h1>
        <button
          onClick={() => setShowNewProcessModal(true)}
          disabled={creating}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800 disabled:opacity-50"
        >
          {creating ? "Creating..." : "New Process"}
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          No tasks found. Create your first task!
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <Link
              key={task.id}
              to={
                task.kind === "link" ? `/link/${task.id}` : `/task/${task.id}`
              }
              className="block bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getKindColor(
                        task.kind
                      )}`}
                    >
                      {task.kind === "link"
                        ? "Link Transform"
                        : "API Transform"}
                    </span>
                  </div>

                  {task.api_endpoint && (
                    <div className="mb-2">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        API Endpoint
                      </label>
                      <p className="text-sm text-gray-900 font-mono break-all">
                        {task.api_endpoint}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-12">
                    {task.system_tag && (
                      <div className="mb-2">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          {task.kind === "link" ? "From" : "System Tag"}
                        </label>
                        <p className="text-sm text-gray-900 font-mono break-all">
                          {task.system_tag}
                        </p>
                      </div>
                    )}

                    {task.to_system_tag && task.kind === "link" && (
                      <div className="mb-2">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          To
                        </label>
                        <p className="text-sm text-gray-900 font-mono break-all">
                          {task.to_system_tag}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-6 text-xs text-gray-500">
                    <div>
                      <span className="font-medium">Created:</span>{" "}
                      {moment(formatDate(task.created_at)).format("MM/DD/YYYY")}
                    </div>
                    {task.updated_at && (
                      <div>
                        <span className="font-medium">Updated:</span>{" "}
                        {moment(formatDate(task.updated_at)).format(
                          "MM/DD/YYYY"
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDeleteTask(e, task.id)}
                    className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete process"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                  <div className="text-gray-400">
                    <svg
                      className="w-6 h-6"
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
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal
        isOpen={showNewProcessModal}
        onClose={() => setShowNewProcessModal(false)}
        title="Create New Process"
        size="sm"
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-4">
            Select the type of process you want to create:
          </p>
          <button
            onClick={() => handleCreateTask("api_transform")}
            className="w-full p-4 text-left rounded-lg border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-colors group"
          >
            <div className="font-semibold text-gray-900 group-hover:text-gray-900">
              API Transform
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Transform data from an external API endpoint
            </div>
          </button>
          <button
            onClick={() => handleCreateTask("link")}
            className="w-full p-4 text-left rounded-lg border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-colors group"
          >
            <div className="font-semibold text-gray-900 group-hover:text-gray-900">
              Link
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Create a link-based process
            </div>
          </button>
        </div>
      </Modal>
    </div>
  );
}
