import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import useTaskProgress from "../../hooks/useTaskProgress";
import LinkDetailsTab from "../task/tabs/LinkDetailsTab";
import CreateTransformerTab from "../task/tabs/CreateTransformerTab";
import UIPreviewTab from "../task/Preview/UIPreviewTab";

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
  const [localToResponse, setLocalToResponse] = useState(null);
  const [localFromResponse, setLocalFromResponse] = useState(
    snapshot?.input_payload?.from_response
  );
  const [isGeneratingTransformCode, setIsGeneratingTransformCode] =
    useState(false);
  const [generatingTransformMessage, setGeneratingTransformMessage] =
    useState("");
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [generatingPreviewMessage, setGeneratingPreviewMessage] = useState("");

  useEffect(() => {
    if (snapshot?.input_payload?.from_response) {
      setLocalFromResponse(snapshot?.input_payload?.from_response);
    } else if (fromSystemTag && !localFromResponse) {
      // Get data from the response_json of the task identified by system_tag
      const fromTask = allTasks.find((t) => t.system_tag === fromSystemTag);
      if (fromTask?.response_json) {
        setLocalFromResponse(fromTask.response_json);
      }
    }
  }, [
    snapshot?.input_payload?.from_response,
    fromSystemTag,
    allTasks,
    localFromResponse,
  ]);

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

  // Clear local state when snapshot updates (WebSocket broadcast)
  useEffect(() => {
    if (snapshot?.input_payload?.from_response) {
      setLocalFromResponse(null);
    }
    if (snapshot?.response_json) {
      setLocalToResponse(null);
    }
  }, [snapshot?.input_payload?.from_response, snapshot?.response_json]);

  // Reset generating state when transform code is received
  useEffect(() => {
    if (snapshot?.transform_code && isGeneratingTransformCode) {
      setIsGeneratingTransformCode(false);
      setGeneratingTransformMessage("");
    }
  }, [snapshot?.transform_code]);

  // Reset generating preview state when preview response is received
  useEffect(() => {
    if (snapshot?.output_payload?.preview_response && isGeneratingPreview) {
      setIsGeneratingPreview(false);
      setGeneratingPreviewMessage("");
    }
  }, [snapshot?.output_payload?.preview_response]);

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
      const fromTask = allTasks.find((t) => t.system_tag === fromSystemTag);
      const toTask = allTasks.find((t) => t.system_tag === toSystemTag);

      const updateResponse = await fetch(`/api/tasks/${task_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: {
            system_tag: fromSystemTag,
            to_system_tag: toSystemTag,
            input_payload: { from_response: fromTask.response_json },
            response_json: toTask.api_endpoint,
          },
        }),
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to update link task");
      }

      setLocalFromResponse(fromTask.response_json);
      setLocalToResponse(toTask.api_endpoint);

      // Navigate to the transformer tab
      navigate(`/link/${task_id}/transformer`);
    } catch (error) {
      console.error("Continue error:", error);
      setFormError(error.message);
    } finally {
      setIsProcessing(false);
    }
  }

  const hasLinkData = snapshot?.input_payload && snapshot?.response_json;

  async function handleGenerateTransform(dataDescription) {
    setIsGeneratingTransformCode(true);
    setGeneratingTransformMessage("Generating Transformation Code...");

    const interval = setInterval(() => {
      setGeneratingTransformMessage((prev) =>
        prev === "Generating Transformation Code..."
          ? "Background process, may take several seconds"
          : "Generating Transformation Code..."
      );
    }, 3000);

    try {
      const taskResponse = await fetch(`/api/tasks/${task_id}/run_job`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: {
            input_payload: {
              from_response:
                localFromResponse || snapshot?.input_payload?.from_response,
              to_response: localToResponse || snapshot?.response_json,
              task_type: "generate_transform_code",
            },
            data_description: dataDescription,
          },
        }),
      });

      if (!taskResponse.ok) {
        throw new Error("Unable to run transform job");
      }
    } catch (error) {
      console.error(error);
      setIsGeneratingTransformCode(false);
      setGeneratingTransformMessage("");
      clearInterval(interval);
    }

    // Cleanup interval when component unmounts or when generation completes
    return () => clearInterval(interval);
  }

  async function handleGeneratePreview() {
    setIsGeneratingPreview(true);
    setGeneratingPreviewMessage("Generating Link Preview...");

    const interval = setInterval(() => {
      setGeneratingPreviewMessage((prev) =>
        prev === "Generating Link Preview..."
          ? "Running transformations in sequence"
          : "Generating Link Preview..."
      );
    }, 3000);

    try {
      const taskResponse = await fetch(`/api/tasks/${task_id}/run_job`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: {
            input_payload: {
              task_type: "generate_link_preview",
            },
          },
        }),
      });

      if (!taskResponse.ok) {
        throw new Error("Unable to run link preview job");
      }
    } catch (error) {
      console.error(error);
      setIsGeneratingPreview(false);
      setGeneratingPreviewMessage("");
      clearInterval(interval);
    }

    // Cleanup interval when component unmounts or when generation completes
    return () => clearInterval(interval);
  }

  const tabs = [
    { id: "details", label: "Link Details", enabled: true },
    { id: "transformer", label: "Create Transformation", enabled: hasLinkData },
    {
      id: "preview",
      label: "UI Preview",
      enabled: hasLinkData && snapshot?.transform_code,
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
        <CreateTransformerTab
          isGeneratingTransformCode={isGeneratingTransformCode}
          generatingTransformMessage={generatingTransformMessage}
          onGenerateTransform={handleGenerateTransform}
          transformCode={snapshot?.transform_code}
          fromResponse={localFromResponse}
          toResponse={localToResponse || snapshot?.response_json}
          taskId={task_id}
          onResponseUpdate={updateResponseJson}
          isLinkTask={true}
          navigate={navigate}
          onGeneratePreview={handleGeneratePreview}
          isGeneratingPreview={isGeneratingPreview}
          setIsGeneratingPreview={setIsGeneratingPreview}
          generatingPreviewMessage={generatingPreviewMessage}
        />
      )}

      {tab === "preview" && (
        <UIPreviewTab
          responseJson={snapshot?.output_payload?.preview_response}
          isGeneratingTransformCode={isGeneratingPreview}
          generatingTransformMessage={generatingPreviewMessage}
          onNextStep={() => navigate(`/link/${task_id}/transformer`)}
        />
      )}
    </div>
  );
}
