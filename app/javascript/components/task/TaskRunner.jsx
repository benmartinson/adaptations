import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import useTaskProgress from "../../hooks/useTaskProgress";
import PreviewList from "./PreviewList";
import { limitArraySizes } from "../../helpers";
// import TaskStatus from "./TaskStatus";
// import EventLog from "./EventLog";

export default function TaskRunner() {
  const { task_id } = useParams();
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [dataDescription, setDataDescription] = useState("");
  const [fromResponse, setFromResponse] = useState({});
  const [fetchingEndpoint, setFetchingEndpoint] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [formError, setFormError] = useState(null);

  const { snapshot, responseJson } = useTaskProgress(task_id);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    if (!snapshot) return;
    setTasks((prev) => {
      const filtered = prev.filter((task) => task.id !== snapshot.id);
      return [snapshot, ...filtered].slice(0, 15);
    });

    // Load api_endpoint and data_description from snapshot if available
    if (snapshot.api_endpoint && !apiEndpoint) {
      setApiEndpoint(snapshot.api_endpoint);
    }
    if (snapshot.data_description && !dataDescription) {
      setDataDescription(snapshot.data_description);
    }
  }, [snapshot]);

  const activeTask = useMemo(() => {
    if (snapshot && snapshot.id === task_id) {
      return snapshot;
    }
    return tasks.find((task) => task.id === task_id) || snapshot;
  }, [snapshot, tasks, task_id]);

  const isGenerating =
    fetchingEndpoint ||
    (activeTask &&
      ["pending", "running"].includes(activeTask.status) &&
      !responseJson);

  async function loadTasks() {
    try {
      const response = await fetch("/api/tasks?limit=15");
      if (!response.ok) {
        throw new Error("Unable to load tasks");
      }
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleFetchEndpoint() {
    if (!apiEndpoint) {
      setFormError("Please provide an API endpoint.");
      return;
    }

    setFormError(null);
    setFetchingEndpoint(true);
    try {
      // Fetch the endpoint data
      const response = await fetch(apiEndpoint);
      if (!response.ok) {
        throw new Error("Unable to fetch from endpoint");
      }

      const text = await response.text();
      let fetchedData;
      try {
        fetchedData = JSON.parse(text);
        // Limit array sizes to reduce token usage
        fetchedData = limitArraySizes(fetchedData, 10);
        setFromResponse(fetchedData);
      } catch {
        fetchedData = text;
        setFromResponse(text);
      }

      // Automatically create the transformation task
      const taskResponse = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: {
            kind: "code_workflow",
            api_endpoint: apiEndpoint,
            data_description: dataDescription,
            input_payload: {
              from_response: fetchedData,
              task_type: "transformed_response_generation",
            },
            metadata: {
              source: "web-ui",
            },
          },
        }),
      });

      if (!taskResponse.ok) {
        throw new Error("Unable to create task");
      }

      const task = await taskResponse.json();
      setTasks((prev) => [task, ...prev].slice(0, 15));
      // Redirect to the new task
      window.location.href = `/task/${task.id}`;
    } catch (error) {
      console.error(error);
      setFormError(error.message);
      setFetchingEndpoint(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <Link
          to="/tasks"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          All Tasks
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">API Endpoint</h2>

        {formError && (
          <div className="bg-red-50 border border-red-200 text-sm text-red-700 rounded-xl px-4 py-3">
            {formError}
          </div>
        )}

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Enter API Endpoint
          </label>
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              type="url"
              className="flex-1 rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/api/endpoint"
              value={apiEndpoint}
              onChange={(event) => setApiEndpoint(event.target.value)}
              disabled={fetchingEndpoint}
            />
            <button
              type="button"
              onClick={handleFetchEndpoint}
              className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800 disabled:opacity-50"
              disabled={!apiEndpoint || fetchingEndpoint}
            >
              {fetchingEndpoint ? "Fetching..." : "Get Response"}
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Data Description (Optional)
            </label>
            <textarea
              className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 resize-y"
              placeholder="Describe the data returned by this endpoint to help the chatbot understand and transform it better..."
              value={dataDescription}
              onChange={(event) => setDataDescription(event.target.value)}
              disabled={fetchingEndpoint}
              rows={3}
            />
            <p className="text-xs text-gray-500">
              Optional: Provide context about the data structure, field
              meanings, or transformation goals.
            </p>
          </div>

          {isGenerating && (
            <div className="text-gray-500 text-sm">Generating...</div>
          )}
        </div>
      </div>

      {responseJson && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Preview</h2>
          <PreviewList toResponseText={JSON.stringify(responseJson, null, 2)} />
        </div>
      )}

      {/* <TaskStatus
        activeTask={activeTask}
        latestCode={latestCode}
        testResults={testResults}
        progressError={progressError}
      />

      <div className="grid md:grid-cols-3 gap-6">
        <EventLog events={events} />
      </div> */}
    </div>
  );
}
