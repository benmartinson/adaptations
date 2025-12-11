import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import useTaskProgress from "../../hooks/useTaskProgress";
import LinkDetailsTab from "../task/tabs/LinkDetailsTab";
import TransformationConfigurator from "../task/TransformationConfigurator";

export default function LinkRunner() {
  const { task_id, tab } = useParams();
  const navigate = useNavigate();
  const [fromSystemTag, setFromSystemTag] = useState("");
  const [toSystemTag, setToSystemTag] = useState("");
  const [formError, setFormError] = useState(null);
  const [availableSystemTags, setAvailableSystemTags] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const { snapshot, updateResponseJson } = useTaskProgress(task_id);
  const [isGeneratingTransformCode, setIsGeneratingTransformCode] =
    useState(false);

  useEffect(() => {
    async function loadTasks() {
      try {
        const response = await fetch("/api/tasks");
        if (response.ok) {
          const tasks = await response.json();
          setAllTasks(tasks.filter((t) => t.kind === "api_transform"));
          // Extract unique system tags from tasks
          const tags = [
            ...new Set(
              tasks.filter((t) => t.system_tag).map((t) => t.system_tag)
            ),
          ].sort();
          setAvailableSystemTags(tags);
        }
      } catch (error) {
        console.error("Failed to load tasks:", error);
      }
    }
    loadTasks();
  }, []);

  useEffect(() => {
    if (!snapshot) return;

    if (snapshot.system_tag && !fromSystemTag) {
      setFromSystemTag(snapshot.system_tag);
    }
    if (snapshot.to_system_tag && !toSystemTag) {
      setToSystemTag(snapshot.to_system_tag);
    }
  }, [snapshot]);

  // Reset generating state when transform code is received
  useEffect(() => {
    if (snapshot?.transform_code && isGeneratingTransformCode) {
      setIsGeneratingTransformCode(false);
    }
  }, [snapshot?.transform_code]);

  function handleFromSystemTagChange(value) {
    setFromSystemTag(value);
    // Clear toSystemTag if it matches the newly selected fromSystemTag
    if (value === toSystemTag) {
      setToSystemTag("");
    }
  }

  async function handleContinue() {
    setIsProcessing(true);
    setFormError(null);

    try {
      // Find the tasks from our loaded data
      const fromTask = allTasks.find((t) => t.system_tag === fromSystemTag);
      const toTask = allTasks.find((t) => t.system_tag === toSystemTag);
      // Fetch the data from the "from" task's api_endpoint
      const apiResponse = await fetch(fromTask.api_endpoint);
      console.log("apiResponse", apiResponse);
      if (!apiResponse.ok) {
        throw new Error("Failed to fetch data from API endpoint");
      }
      const apiData = await apiResponse.json();

      // Update the link task with the data
      const updateResponse = await fetch(`/api/tasks/${task_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: {
            system_tag: fromSystemTag,
            to_system_tag: toSystemTag,
            output_payload: { from_response: apiData },
            response_json: toTask.api_endpoint,
          },
        }),
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to update link task");
      }

      // Navigate to the transformer tab
      navigate(`/link/${task_id}/transformer`);
    } catch (error) {
      console.error("Continue error:", error);
      setFormError(error.message);
    } finally {
      setIsProcessing(false);
    }
  }

  const hasLinkData = snapshot?.output_payload && snapshot?.response_json;

  async function handleGenerateTransform() {
    setIsGeneratingTransformCode(true);

    try {
      const taskResponse = await fetch(`/api/tasks/${task_id}/run_job`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: {
            input_payload: {
              from_response: snapshot?.output_payload?.from_response,
              to_response: snapshot?.response_json,
              task_type: "generate_transform_code",
            },
          },
        }),
      });

      if (!taskResponse.ok) {
        throw new Error("Unable to run transform job");
      }
    } catch (error) {
      console.error(error);
      setIsGeneratingTransformCode(false);
    }
  }

  const tabs = [
    { id: "details", label: "Link Details", enabled: true },
    { id: "transformer", label: "Create Transformation", enabled: hasLinkData },
  ];

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
          All Processes
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((t) =>
            t.enabled ? (
              <Link
                key={t.id}
                to={`/link/${task_id}/${t.id}`}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  tab === t.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {t.label}
              </Link>
            ) : (
              <span
                key={t.id}
                className="py-2 px-1 border-b-2 font-medium text-sm border-transparent text-gray-300 cursor-not-allowed"
              >
                {t.label}
              </span>
            )
          )}
        </nav>
      </div>

      {/* Tab Content */}
      {tab === "details" && (
        <LinkDetailsTab
          fromSystemTag={fromSystemTag}
          setFromSystemTag={handleFromSystemTagChange}
          toSystemTag={toSystemTag}
          setToSystemTag={setToSystemTag}
          formError={formError}
          availableSystemTags={availableSystemTags}
          onContinue={handleContinue}
          isProcessing={isProcessing}
        />
      )}

      {tab === "transformer" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">
                Generate Transform Code
              </h3>
              <p className="text-sm text-gray-500">
                Once you've configured the transformation, generate the code.
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerateTransform}
              disabled={isGeneratingTransformCode}
              className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingTransformCode ? "Generating..." : "Generate Code"}
            </button>
          </div>

          {snapshot?.transform_code && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-gray-600 mb-3 font-medium">Transform Code</p>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap">
                {snapshot.transform_code}
              </pre>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <TransformationConfigurator
              fromResponse={snapshot?.output_payload?.from_response}
              toResponse={snapshot?.response_json}
              taskId={task_id}
              onResponseUpdate={updateResponseJson}
              isLinkTask={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
