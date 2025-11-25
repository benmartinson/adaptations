import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import useTaskProgress from "../../hooks/useTaskProgress";
import PreviewList from "./PreviewList";
import Modal from "../common/Modal";
import TransformationConfigurator from "./TransformationConfigurator";
import { limitArraySizes } from "../../helpers";
// import TaskStatus from "./TaskStatus";
// import EventLog from "./EventLog";

export default function TaskRunner() {
  const { task_id } = useParams();
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [systemTag, setSystemTag] = useState("");
  const [dataDescription, setDataDescription] = useState("");
  const [fromResponse, setFromResponse] = useState({});
  const [fetchingEndpoint, setFetchingEndpoint] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [formError, setFormError] = useState(null);
  const [generatingMessage, setGeneratingMessage] = useState("");
  const [activeTab, setActiveTab] = useState("endpoint-details");
  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState(false);

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

    // Load api_endpoint, system_tag, and data_description from snapshot if available
    if (snapshot.api_endpoint && !apiEndpoint) {
      setApiEndpoint(snapshot.api_endpoint);
    }
    if (snapshot.system_tag && !systemTag) {
      setSystemTag(snapshot.system_tag);
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

  const isGeneratingPreview =
    fetchingEndpoint ||
    (activeTask &&
      ["pending", "running"].includes(activeTask.status) &&
      !responseJson);

  useEffect(() => {
    if (!isGeneratingPreview) {
      setGeneratingMessage("");
      return;
    }

    setGeneratingMessage("");

    const interval = setInterval(() => {
      setGeneratingMessage((prev) =>
        prev === "" ? "Background process, may take several seconds" : ""
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [isGeneratingPreview]);

  // Auto-switch to UI Preview tab when responseJson is available
  useEffect(() => {
    if (responseJson) {
      setActiveTab("ui-preview");
    }
  }, [responseJson]);

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

    if (!systemTag) {
      setFormError("Please provide a System Tag.");
      return;
    }

    if (/\s/.test(systemTag)) {
      setFormError("System Tag must be one word with no spaces.");
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
            system_tag: systemTag,
            data_description: dataDescription,
            input_payload: {
              from_response: fetchedData,
              task_type: "preview_response_generation",
              system_tag: systemTag,
              data_description: dataDescription,
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
    <div className="max-w-6xl mx-auto p-6 space-y-6">
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

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("endpoint-details")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "endpoint-details"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Endpoint Details
          </button>
          <button
            onClick={() => setActiveTab("ui-preview")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "ui-preview"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            UI Preview
          </button>
          <button
            disabled
            className="py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-300 cursor-not-allowed"
          >
            Create Transformer
          </button>
          <button
            disabled
            className="py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-300 cursor-not-allowed"
          >
            Build Schema
          </button>
          <button
            disabled
            className="py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-300 cursor-not-allowed"
          >
            Run Tests
          </button>
        </nav>
      </div>

      {/* Endpoint Details Tab */}
      {activeTab === "endpoint-details" && (
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
                disabled={!apiEndpoint || !systemTag || fetchingEndpoint}
              >
                {fetchingEndpoint ? "Fetching..." : "Generate"}
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                System Tag <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500"
                value={systemTag}
                onChange={(event) => setSystemTag(event.target.value)}
                disabled={fetchingEndpoint}
              />
              <p className="text-xs text-gray-500">
                Required: Request identifier tag that describes the request
                (e.g., "BooksByAuthor"). Must be one word with no spaces.
              </p>
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
                rows={3}
              />
              <p className="text-xs text-gray-500">
                Optional: Provide context about the data structure, field
                meanings, or transformation goals.
              </p>
            </div>

            {isGeneratingPreview && (
              <div className="text-black text-md font-bold">
                {generatingMessage || "Generating Preview..."}
              </div>
            )}
          </div>
        </div>
      )}

      {/* UI Preview Tab */}
      {activeTab === "ui-preview" && (
        <>
          {responseJson && (
            <p className="text-sm text-gray-600">
              Here is a preview of what the response data layout will look like
              after it's been transformed. If it's not correct, you can go back
              to the 'Endpoint Details' section and modify the 'Data
              Description' to provide the model with more details about what
              data transformation is required. If you need more control you can
              click{" "}
              <button
                onClick={() => setIsAdvancedModalOpen(true)}
                className="text-blue-600 hover:text-blue-800 font-medium underline"
              >
                here
              </button>{" "}
              to open advanced options.
            </p>
          )}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {responseJson ? (
              <>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Preview
                </h2>
                <PreviewList
                  toResponseText={JSON.stringify(responseJson, null, 2)}
                />
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No preview available yet.</p>
                <p className="text-sm mt-2">
                  Please fetch an endpoint first from the Endpoint Details tab.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Advanced Options Modal */}
      <Modal
        isOpen={isAdvancedModalOpen}
        onClose={() => setIsAdvancedModalOpen(false)}
        title="Advanced Options"
        size="xl"
      >
        <TransformationConfigurator
          fromResponse={snapshot?.input_payload?.from_response}
          toResponse={responseJson}
        />
      </Modal>

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
