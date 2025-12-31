import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import DynamicUIFile from "../task/Preview/DynamicUIFile";

export default function AppRunner() {
  const { system_tag } = useParams();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [responseJson, setResponseJson] = useState(null);

  // Get api_endpoint from query params or navigation state
  const searchParams = new URLSearchParams(location.search);
  const apiEndpoint =
    location.state?.api_endpoint || searchParams.get("api_endpoint");

  useEffect(() => {
    if (!system_tag || !apiEndpoint) {
      setError(
        !system_tag
          ? "Missing system_tag parameter"
          : "Missing api_endpoint parameter"
      );
      setLoading(false);
      return;
    }

    async function runTransform() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/apps/run", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            system_tag: system_tag,
            api_endpoint: apiEndpoint,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Request failed: ${response.status}`);
        }

        setTaskId(data.task_id);
        setResponseJson(data.data);
      } catch (e) {
        console.error("AppRunner error:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    runTransform();
  }, [system_tag, apiEndpoint]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading {system_tag}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-700">{error}</p>
            {!apiEndpoint && (
              <p className="text-red-600 mt-4 text-sm">
                Hint: Include api_endpoint as a query parameter, e.g.,{" "}
                <code className="bg-red-100 px-1 rounded">
                  /app/{system_tag}?api_endpoint=https://example.com/api/data
                </code>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!taskId || !responseJson) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-700">No data available to display.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <DynamicUIFile taskId={taskId} responseJson={responseJson} />
      </div>
    </div>
  );
}
