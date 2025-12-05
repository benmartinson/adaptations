import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import useTaskProgress from "../../hooks/useTaskProgress";
import EndpointDetailsTab from "./tabs/EndpointDetailsTab";
import UIPreviewTab from "./Preview/UIPreviewTab";
import CreateTransformerTab from "./tabs/CreateTransformerTab";
import RunTestsTab from "./tests/RunTestsTab";
import { fetchEndpointData } from "../../helpers";

export default function TaskRunner() {
  const { task_id } = useParams();
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [systemTag, setSystemTag] = useState("");
  const [dataDescription, setDataDescription] = useState("");
  const [fetchingEndpoint, setFetchingEndpoint] = useState(false);
  const [formError, setFormError] = useState(null);
  const [generatingMessage, setGeneratingMessage] = useState("");
  const [activeTab, setActiveTab] = useState("endpoint-details");
  const [generatingTransform, setGeneratingTransform] = useState(false);
  const [generatingTransformMessage, setGeneratingTransformMessage] =
    useState("");

  const {
    snapshot,
    responseJson,
    transformCode,
    updateResponseJson,
    tests,
    addTest,
    parameters,
    updateParameters,
  } = useTaskProgress(task_id);

  const isGeneratingTransformCode = snapshot?.phase === "code_generation";

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
    (snapshot?.phase === "preview_generation" && !responseJson);

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

  // Auto-switch to run-tests tab when transformCode is received
  useEffect(() => {
    if (transformCode) {
      setActiveTab("run-tests");
    }
  }, [transformCode]);

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
      const fetchedData = await fetchEndpointData(apiEndpoint);

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
    { id: "ui-preview", label: "UI Preview", enabled: !!responseJson },
    {
      id: "create-transformer",
      label: "Create Transformer",
      enabled: !!responseJson,
    },
    { id: "run-tests", label: "Run Tests", enabled: !!transformCode },
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
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
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
          fetchingEndpoint={isGeneratingPreview}
          formError={formError}
          onFetchEndpoint={handleFetchEndpoint}
          isGeneratingPreview={isGeneratingPreview}
          generatingMessage={generatingMessage}
          taskId={task_id}
          parameters={parameters}
          onParametersChange={updateParameters}
        />
      )}

      {activeTab === "ui-preview" && (
        <UIPreviewTab
          responseJson={responseJson}
          isGeneratingTransformCode={isGeneratingTransformCode}
          onNextStep={() => setActiveTab("create-transformer")}
          generatingTransformMessage={generatingTransformMessage}
          fromResponse={snapshot?.input_payload?.from_response}
          task={snapshot}
          apiEndpoint={apiEndpoint}
          onResponseUpdate={updateResponseJson}
        />
      )}

      {activeTab === "create-transformer" && (
        <CreateTransformerTab
          isGeneratingTransformCode={isGeneratingTransformCode}
          generatingTransformMessage={generatingTransformMessage}
          onGenerateTransform={handleGenerateTransform}
          onBackStep={() => setActiveTab("ui-preview")}
          transformCode={transformCode}
        />
      )}

      {activeTab === "run-tests" && (
        <RunTestsTab
          responseJson={responseJson}
          apiEndpoint={snapshot?.api_endpoint}
          task={snapshot}
          tests={tests}
          onTestCreated={addTest}
        />
      )}
    </div>
  );
}
