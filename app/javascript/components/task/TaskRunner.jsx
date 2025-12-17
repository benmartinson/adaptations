import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import useTaskProgress from "../../hooks/useTaskProgress";
import EndpointDetailsTab from "./tabs/EndpointDetailsTab";
import UIPreviewTab from "./Preview/UIPreviewTab";
import CreateTransformerTab from "./tabs/CreateTransformerTab";
import RunTestsTab from "./tests/RunTestsTab";
import DeployTab from "./tabs/DeployTab";
import { fetchEndpointData } from "../../helpers";

export default function TaskRunner() {
  const { task_id, tab } = useParams();
  const navigate = useNavigate();
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [systemTag, setSystemTag] = useState("");
  const [fetchingEndpoint, setFetchingEndpoint] = useState(false);
  const [formError, setFormError] = useState(null);
  const [generatingMessage, setGeneratingMessage] = useState("");
  const [generatingTransform, setGeneratingTransform] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const prevTransformCodeRef = useRef(null);
  const prevResponseJsonRef = useRef(null);
  const [fromResponseData, setFromResponseData] = useState(null);
  const {
    snapshot,
    responseJson,
    transformCode,
    updateResponseJson,
    tests,
    addTest,
    updateTest,
  } = useTaskProgress(task_id);
  const isGeneratingPreview =
    fetchingEndpoint || snapshot?.phase === "preview_generation";

  const isGeneratingTransformCode = snapshot?.phase === "code_generation";

  // Run all tests after successful regeneration
  useEffect(() => {
    if (
      isRegenerating &&
      transformCode &&
      transformCode !== prevTransformCodeRef.current
    ) {
      setIsRegenerating(false);
      // Navigate to tests tab and run all tests
      navigate(`/task/${task_id}/tests`);
      fetch(`/api/tasks/${task_id}/run_tests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }).catch((error) => console.error("Failed to run tests:", error));
    }
  }, [transformCode, isRegenerating, task_id, navigate]);

  useEffect(() => {
    if (!snapshot) return;

    if (snapshot.api_endpoint && !apiEndpoint) {
      setApiEndpoint(snapshot.api_endpoint);
    }
    if (snapshot.system_tag && !systemTag) {
      setSystemTag(snapshot.system_tag);
    }
  }, [snapshot]);

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

  useEffect(() => {
    if (responseJson && !fromResponseData && apiEndpoint) {
      fetchEndpointData(apiEndpoint).then((data) => {
        setFromResponseData(data);
      });
    }
  }, [responseJson, fromResponseData, apiEndpoint]);

  async function handleFetchEndpoint(dataDescription) {
    setFormError(null);
    setFetchingEndpoint(true);
    try {
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
      navigate(`/task/${task_id}/preview`);
      setFetchingEndpoint(false);
    } catch (error) {
      console.error(error);
      setFormError(error.message);
      setFetchingEndpoint(false);
    }
  }

  async function handleGenerateTransform() {
    setGeneratingTransform(true);
    navigate(`/task/${task_id}/transformer`);

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

  async function handleRegenerateTransform() {
    setIsRegenerating(true);
    prevTransformCodeRef.current = transformCode;
    navigate(`/task/${task_id}/transformer`);

    try {
      const taskResponse = await fetch(`/api/tasks/${task_id}/run_job`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: {
            input_payload: {
              task_type: "generate_transform_code",
            },
          },
        }),
      });

      if (!taskResponse.ok) {
        throw new Error("Unable to run regenerate transform job");
      }
    } catch (error) {
      console.error(error);
      setIsRegenerating(false);
    }
  }

  const tabs = [
    { id: "endpoint", label: "Endpoint Details", enabled: true },
    { id: "preview", label: "UI Preview", enabled: !!responseJson },
    {
      id: "transformer",
      label: "Create Transformer",
      enabled: !!responseJson,
    },
    { id: "tests", label: "Run Tests", enabled: !!transformCode },
    { id: "deploy", label: "Deploy", enabled: !!transformCode },
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
                to={`/task/${task_id}/${t.id}`}
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
      {tab === "endpoint" && (
        <EndpointDetailsTab
          taskId={task_id}
          apiEndpoint={apiEndpoint}
          setApiEndpoint={setApiEndpoint}
          systemTag={systemTag}
          setSystemTag={setSystemTag}
          fetchingEndpoint={isGeneratingPreview}
          formError={formError}
          onFetchEndpoint={handleFetchEndpoint}
          isGeneratingPreview={isGeneratingPreview}
          generatingMessage={generatingMessage}
          transformCode={transformCode}
        />
      )}

      {tab === "preview" && (
        <UIPreviewTab
          responseJson={responseJson}
          isGeneratingPreview={isGeneratingPreview}
          onNextStep={() => navigate(`/task/${task_id}/transformer`)}
          taskId={task_id}
        />
      )}

      {tab === "transformer" && (
        <CreateTransformerTab
          isGeneratingTransformCode={isGeneratingTransformCode}
          onGenerateTransform={handleGenerateTransform}
          transformCode={transformCode}
          fromResponse={fromResponseData}
          toResponse={responseJson}
          taskId={task_id}
          onResponseUpdate={updateResponseJson}
        />
      )}

      {tab === "tests" && (
        <RunTestsTab
          task={snapshot}
          tests={tests}
          onTestCreated={addTest}
          onTestUpdate={updateTest}
          onRegenerateTransform={handleRegenerateTransform}
        />
      )}

      {tab === "deploy" && <DeployTab task={snapshot} />}
    </div>
  );
}
