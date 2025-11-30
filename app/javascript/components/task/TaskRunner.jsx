import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import useTaskProgress from "../../hooks/useTaskProgress";
import Modal from "../common/Modal";
import TransformationConfigurator from "./TransformationConfigurator";
import EndpointDetailsTab from "./tabs/EndpointDetailsTab";
import UIPreviewTab from "./tabs/UIPreviewTab";
import CreateTransformerTab from "./tabs/CreateTransformerTab";
import { limitArraySizes } from "../../helpers";

export default function TaskRunner() {
  const { task_id } = useParams();
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [systemTag, setSystemTag] = useState("");
  const [dataDescription, setDataDescription] = useState("");
  const [fetchingEndpoint, setFetchingEndpoint] = useState(false);
  const [formError, setFormError] = useState(null);
  const [generatingMessage, setGeneratingMessage] = useState("");
  const [activeTab, setActiveTab] = useState("endpoint-details");
  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState(false);
  const [generatingTransform, setGeneratingTransform] = useState(false);
  const [generatingTransformMessage, setGeneratingTransformMessage] =
    useState("");

  const { snapshot, responseJson, transformCode } = useTaskProgress(task_id);

  // Check if we're in the code_generation phase from metadata
  const isGeneratingTransformCode =
    generatingTransform || snapshot?.metadata?.phase === "code_generation";

  // Load api_endpoint, system_tag, and data_description from snapshot if available
  useEffect(() => {
    if (!snapshot) return;

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

  const isGeneratingPreview =
    fetchingEndpoint ||
    (snapshot &&
      ["running-preview-response-generation"].includes(snapshot.status) &&
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

  // Auto-switch to appropriate tab based on available data
  useEffect(() => {
    if (transformCode) {
      setActiveTab("create-transformer");
      setGeneratingTransform(false);
    } else if (responseJson) {
      setActiveTab("ui-preview");
    }
  }, [responseJson, transformCode]);

  // Switching text for transform generation
  useEffect(() => {
    if (!isGeneratingTransformCode) {
      setGeneratingTransformMessage("");
      return;
    }

    setGeneratingTransformMessage("Generating Transformation Code...");

    const interval = setInterval(() => {
      setGeneratingTransformMessage((prev) =>
        prev === "Generating Transformation Code..."
          ? "Background process, may take several seconds"
          : "Generating Transformation Code..."
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [isGeneratingTransformCode]);

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
      } catch {
        fetchedData = text;
      }

      // Update the existing task and run the job
      const taskResponse = await fetch(`/api/tasks/${task_id}/run_job`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: {
            api_endpoint: apiEndpoint,
            system_tag: systemTag,
            data_description: dataDescription,
            input_payload: {
              from_response: fetchedData,
              task_type: "preview_response_generation",
              system_tag: systemTag,
              data_description: dataDescription,
            },
          },
        }),
      });

      if (!taskResponse.ok) {
        throw new Error("Unable to run task");
      }

      setFetchingEndpoint(false);
    } catch (error) {
      console.error(error);
      setFormError(error.message);
      setFetchingEndpoint(false);
    }
  }

  async function handleGenerateTransform() {
    const fromResponseData = snapshot?.input_payload?.from_response;
    if (!fromResponseData || !responseJson) {
      return;
    }

    setGeneratingTransform(true);
    setActiveTab("create-transformer");
    setIsAdvancedModalOpen(false);

    try {
      const taskResponse = await fetch(`/api/tasks/${task_id}/run_job`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: {
            input_payload: {
              from_response: fromResponseData,
              to_response: responseJson,
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
      setGeneratingTransform(false);
    }
  }

  const tabs = [
    { id: "endpoint-details", label: "Endpoint Details", enabled: true },
    { id: "ui-preview", label: "UI Preview", enabled: true },
    { id: "create-transformer", label: "Create Transformer", enabled: true },
    { id: "run-tests", label: "Run Tests", enabled: false },
    { id: "deploy", label: "Deploy", enabled: false },
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
          All Tasks
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => tab.enabled && setActiveTab(tab.id)}
              disabled={!tab.enabled}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                !tab.enabled
                  ? "border-transparent text-gray-300 cursor-not-allowed"
                  : activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "endpoint-details" && (
        <EndpointDetailsTab
          apiEndpoint={apiEndpoint}
          setApiEndpoint={setApiEndpoint}
          systemTag={systemTag}
          setSystemTag={setSystemTag}
          dataDescription={dataDescription}
          setDataDescription={setDataDescription}
          fetchingEndpoint={fetchingEndpoint}
          formError={formError}
          onFetchEndpoint={handleFetchEndpoint}
          isGeneratingPreview={isGeneratingPreview}
          generatingMessage={generatingMessage}
        />
      )}

      {activeTab === "ui-preview" && (
        <UIPreviewTab
          responseJson={responseJson}
          isGeneratingTransformCode={isGeneratingTransformCode}
          onGenerateTransform={handleGenerateTransform}
          generatingTransformMessage={generatingTransformMessage}
          onOpenAdvancedOptions={() => setIsAdvancedModalOpen(true)}
        />
      )}

      {activeTab === "create-transformer" && (
        <CreateTransformerTab
          isGeneratingTransformCode={isGeneratingTransformCode}
          transformCode={transformCode}
          generatingTransformMessage={generatingTransformMessage}
          onGenerateTransform={handleGenerateTransform}
          onNextStep={() => setActiveTab("run-tests")}
        />
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
          onGenerateTransform={handleGenerateTransform}
          isGenerating={isGeneratingTransformCode}
        />
      </Modal>
    </div>
  );
}
