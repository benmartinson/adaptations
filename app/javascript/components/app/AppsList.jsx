import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import moment from "moment";
import Modal from "../common/Modal";

export default function AppsList() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [showNewAppModal, setShowNewAppModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadApps();
  }, []);

  async function loadApps() {
    try {
      setLoading(true);
      const response = await fetch("/api/apps");
      if (!response.ok) {
        throw new Error("Unable to load apps");
      }
      const data = await response.json();
      setApps(data);
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateApp() {
    setCreating(true);
    setShowNewAppModal(false);
    try {
      const response = await fetch("/api/apps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          app: {
            name: "New App",
            description: "Description for new app",
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to create app");
      }

      const app = await response.json();
      navigate(`/${app.id}/processes`);
    } catch (error) {
      console.error(error);
      setError(error.message);
      setCreating(false);
    }
  }

  async function handleDeleteApp(e, appId) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this app? This will delete all associated processes.")) {
      return;
    }

    try {
      const response = await fetch(`/api/apps/${appId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Unable to delete app");
      }

      setApps((prev) => prev.filter((a) => a.id !== appId));
    } catch (error) {
      console.error(error);
      setError(error.message);
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
        <div className="text-center text-gray-500">Loading apps...</div>
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
        <h1 className="text-3xl font-bold text-gray-900">Apps</h1>
        <button
          onClick={() => setShowNewAppModal(true)}
          disabled={creating}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800 disabled:opacity-50"
        >
          {creating ? "Creating..." : "New App"}
        </button>
      </div>

      {apps.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          No apps found. Create your first app!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => (
            <Link
              key={app.id}
              to={`/${app.id}/processes`}
              className="block bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {app.name}
                  </h3>

                  {app.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {app.description}
                    </p>
                  )}

                  <div className="text-xs text-gray-500">
                    Created {formatDate(app.created_at)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDeleteApp(e, app.id)}
                    className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete app"
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
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal
        isOpen={showNewAppModal}
        onClose={() => setShowNewAppModal(false)}
        title="Create New App"
        size="sm"
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-4">
            This will create a new app with default settings.
          </p>
          <button
            onClick={handleCreateApp}
            className="w-full p-4 text-left rounded-lg border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-colors group"
          >
            <div className="font-semibold text-gray-900 group-hover:text-gray-900">
              Create App
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Create a new app to organize your processes
            </div>
          </button>
        </div>
      </Modal>
    </div>
  );
}
