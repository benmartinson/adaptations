import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import useTaskProgress from "../../hooks/useTaskProgress";
import ListLinkDetailsTab from "./ListLinkDetailsTab";
import ListLinkTransformerTab from "./ListLinkTransformerTab";
import ListLinkTestsTab from "./ListLinkTestsTab";

export default function ListLinkRunner() {
  const { task_id, tab } = useParams();
  const navigate = useNavigate();
  const [fromSystemTag, setFromSystemTag] = useState("");
  const [toSystemTag, setToSystemTag] = useState("");
  const [formError, setFormError] = useState(null);
  const [availableSystemTags, setAvailableSystemTags] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { snapshot, tests, addTest, updateTest } = useTaskProgress(task_id);
  const [localFromResponse, setLocalFromResponse] = useState(null);
  const [isGeneratingTransformCode, setIsGeneratingTransformCode] =
    useState(false);
  const [exampleMappings, setExampleMappings] = useState([]);

  const fromTask = allTasks.find((t) => t.system_tag === fromSystemTag);
  const toTask = allTasks.find((t) => t.system_tag === toSystemTag);

  // Initialize example mappings from snapshot or from response
  useEffect(() => {
    if (localFromResponse && exampleMappings.length === 0) {
      const sampleItems = Array.isArray(localFromResponse)
        ? localFromResponse.slice(0, 3)
        : Array.isArray(localFromResponse.items)
        ? localFromResponse.items.slice(0, 3)
        : [];

      if (sampleItems.length > 0) {
        setExampleMappings(sampleItems.map((item) => ({ item, endpoint: "" })));
      }
    }
  }, [localFromResponse, exampleMappings.length]);

  // Set localFromResponse from snapshot or parent task
  useEffect(() => {
    if (snapshot?.input_payload?.from_response) {
      setLocalFromResponse(snapshot.input_payload.from_response);
    } else if (fromSystemTag && !localFromResponse) {
      const fromTask = allTasks.find((t) => t.system_tag === fromSystemTag);
      if (fromTask?.response_json) {
        setLocalFromResponse(fromTask.response_json);
      }
    }
  }, [snapshot?.input_payload?.from_response, fromSystemTag, allTasks]);

  // Load all tasks for system tag selection
  useEffect(() => {
    async function loadTasks() {
      try {
        const response = await fetch("/api/tasks");
        if (response.ok) {
          const tasks = await response.json();
          setAllTasks(tasks.filter((t) => t.kind === "api_transform"));
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

  // Initialize system tags from snapshot
  useEffect(() => {
    if (!snapshot) return;

    if (snapshot.system_tag && !fromSystemTag) {
      setFromSystemTag(snapshot.system_tag);
    }
    if (snapshot.to_system_tag && !toSystemTag) {
      setToSystemTag(snapshot.to_system_tag);
    }
    if (snapshot.input_payload?.example_mappings?.length > 0) {
      setExampleMappings(snapshot.input_payload.example_mappings);
    }
  }, [snapshot]);

  // Reset generating state when transform code is received
  useEffect(() => {
    if (snapshot?.transform_code && isGeneratingTransformCode) {
      setIsGeneratingTransformCode(false);
    }
  }, [snapshot?.transform_code]);

  async function handleSaveDetails(mappings) {
    setIsProcessing(true);
    setFormError(null);

    try {
      const filledMappings = mappings.filter((m) => m.endpoint.trim());
      const updateResponse = await fetch(`/api/tasks/${task_id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: {
            system_tag: fromSystemTag,
            to_system_tag: toSystemTag,
            input_payload: {
              from_response: fromTask?.response_json || localFromResponse,
              example_mappings: filledMappings,
            },
            response_json: toTask?.api_endpoint,
          },
        }),
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to update list link task");
      }

      setLocalFromResponse(fromTask?.response_json || localFromResponse);
      navigate(`/1/list-link/${task_id}/transformer`);
    } catch (error) {
      console.error("Save error:", error);
      setFormError(error.message);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleGenerateTransform() {
    setIsGeneratingTransformCode(true);
    navigate(`/1/list-link/${task_id}/transformer`);

    try {
      // Save the to_system_tag first
      await fetch(`/api/tasks/${task_id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: { to_system_tag: toSystemTag },
        }),
      });

      const filledMappings = (
        snapshot?.input_payload?.example_mappings || exampleMappings
      ).filter((m) => m.endpoint.trim());

      const response = await fetch(
        `/api/tasks/${snapshot.metadata?.parent_task_id}/generate_list_link`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            list_link_id: task_id,
            example_mappings: filledMappings,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate code");
      }
    } catch (error) {
      console.error(error);
      setIsGeneratingTransformCode(false);
    }
  }

  const hasConfiguredMappings =
    (snapshot?.input_payload?.example_mappings || []).filter((m) =>
      m.endpoint?.trim()
    ).length >= 2;

  const tabs = [
    { id: "details", label: "Link Details", enabled: true },
    {
      id: "transformer",
      label: "Create Transformation",
      enabled: hasConfiguredMappings || Boolean(snapshot?.transform_code),
    },
    {
      id: "tests",
      label: "Run Tests",
      enabled: Boolean(snapshot?.transform_code),
    },
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
                to={`/list-link/${task_id}/${t.id}`}
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
        <ListLinkDetailsTab
          fromSystemTag={fromSystemTag}
          toSystemTag={toSystemTag}
          setToSystemTag={setToSystemTag}
          fromResponse={localFromResponse}
          toEndpoint={toTask?.api_endpoint}
          formError={formError}
          availableSystemTags={availableSystemTags}
          exampleMappings={exampleMappings}
          setExampleMappings={setExampleMappings}
          onContinue={handleSaveDetails}
          isProcessing={isProcessing}
        />
      )}

      {tab === "transformer" && (
        <ListLinkTransformerTab
          isGenerating={isGeneratingTransformCode}
          onGenerateTransform={handleGenerateTransform}
          transformCode={snapshot?.transform_code}
          errorMessage={snapshot?.error_message}
        />
      )}

      {tab === "tests" && (
        <ListLinkTestsTab
          fromResponse={localFromResponse}
          transformCode={snapshot?.transform_code}
          tests={tests}
          taskId={task_id}
          onTestCreated={addTest}
          onTestUpdate={updateTest}
        />
      )}
    </div>
  );
}
