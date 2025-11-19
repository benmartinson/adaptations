import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";
import useTaskProgress from "../../hooks/useTaskProgress";
import AttributeSelector from "./AttributeSelector";
import StepCard from "./StepCard";

function setNestedValue(target, path, nextValue) {
  if (!Array.isArray(path) || path.length === 0) return nextValue;

  const [{ name, type }, ...rest] = path;
  const normalizedType = (type || "").toLowerCase();
  const base = Array.isArray(target) ? [...target] : { ...(target || {}) };

  if (normalizedType === "array") {
    const existingArray = Array.isArray(base[name]) ? [...base[name]] : [];

    if (rest.length === 0) {
      base[name] = [nextValue];
      return base;
    }

    const nextValueInArray = setNestedValue(existingArray[0], rest, nextValue);
    base[name] = [nextValueInArray];
    return base;
  }

  const currentChild = base[name];
  base[name] =
    rest.length === 0
      ? nextValue
      : setNestedValue(currentChild, rest, nextValue);
  return base;
}

export default function TaskRunner() {
  const [apiEndpoint, setApiEndpoint] = useState(
    "https://openlibrary.org/works/OL27965224W/editions.json"
  );
  const [fromResponse, setFromResponse] = useState({});
  const [toResponse, setToResponse] = useState(null);
  const [toResponseText, setToResponseText] = useState("");
  const [toResponseJsonError, setToResponseJsonError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [fetchingEndpoint, setFetchingEndpoint] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [stopPending, setStopPending] = useState(false);

  const {
    snapshot,
    events,
    connected,
    error: progressError,
    latestCode,
    responseJson,
    testResults,
    requestStop,
  } = useTaskProgress(selectedTaskId);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    console.log("responseJson", responseJson);
    if (responseJson) {
      setToResponse(responseJson);
    }
  }, [responseJson]);

  useEffect(() => {
    if (!snapshot) return;
    setTasks((prev) => {
      const filtered = prev.filter((task) => task.id !== snapshot.id);
      return [snapshot, ...filtered].slice(0, 15);
    });
  }, [snapshot]);

  useEffect(() => {
    if (toResponse === null) {
      setToResponseText("");
      return;
    }
    const stringified = JSON.stringify(toResponse, null, 2);
    setToResponseText((prev) => {
      return prev !== stringified ? stringified : prev;
    });
    setToResponseJsonError(null);
  }, [toResponse]);

  useEffect(() => {
    if (!toResponseText) return;

    const hasFromResponse =
      fromResponse &&
      (typeof fromResponse === "string"
        ? fromResponse.length > 0
        : Object.keys(fromResponse).length > 0);

    if (hasFromResponse) {
      setCurrentStep(2);
    } else if (apiEndpoint && !fetchingEndpoint && !formError) {
      handleFetchEndpoint();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toResponseText, fromResponse, fetchingEndpoint, formError]);

  const activeTask = useMemo(() => {
    if (snapshot && snapshot.id === selectedTaskId) {
      return snapshot;
    }
    return tasks.find((task) => task.id === selectedTaskId) || snapshot;
  }, [snapshot, tasks, selectedTaskId]);

  const activeStatus = activeTask?.status;
  const isCancelable =
    activeTask && ["pending", "running"].includes(activeStatus);

  const latestPhase =
    events.length > 0
      ? events[events.length - 1].phase
      : activeTask?.metadata?.phase;

  async function loadTasks() {
    try {
      const response = await fetch("/api/tasks?limit=15");
      if (!response.ok) {
        throw new Error("Unable to load tasks");
      }
      const data = await response.json();
      setTasks(data);
      if (!selectedTaskId && data.length > 0) {
        setSelectedTaskId(data[0].id);
      }
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
      const response = await fetch(apiEndpoint);
      if (!response.ok) {
        throw new Error("Unable to fetch from endpoint");
      }

      const text = await response.text();
      try {
        const data = JSON.parse(text);
        setFromResponse(data);
      } catch {
        setFromResponse(text);
      }
    } catch (error) {
      console.error(error);
      setFormError(error.message);
    } finally {
      setFetchingEndpoint(false);
    }
  }

  async function handleSubmit(event, taskType = "code_workflow") {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      if (toResponseJsonError) {
        setSubmitting(false);
        return;
      }
      // let parsedToResponse = toResponse;
      // try {
      //   parsedToResponse = JSON.parse(toResponseText);
      //   setToResponse(parsedToResponse);
      // } catch (error) {
      //   setToResponseJsonError("Invalid JSON");
      //   setSubmitting(false);
      //   return;
      // }

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: {
            kind: "code_workflow",
            input_payload: {
              from_response: fromResponse,
              task_type: taskType,
            },
            metadata: {
              source: "web-ui",
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to create task");
      }

      const task = await response.json();
      setSelectedTaskId(task.id);
      setTasks((prev) => [task, ...prev].slice(0, 15));
    } catch (error) {
      console.error(error);
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStop() {
    if (!selectedTaskId) return;
    setStopPending(true);
    try {
      requestStop();
      await fetch(`/api/tasks/${selectedTaskId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      await loadTasks();
    } catch (error) {
      console.error(error);
    } finally {
      setStopPending(false);
    }
  }

  function handleGenerate(event) {
    handleSubmit(event, "transformed_response_generation");
  }

  function handleToResponseTextChange(value) {
    setToResponseText(value);
    // Validate JSON
    if (value.trim() === "") {
      setToResponseJsonError(null);
      return;
    }
    try {
      JSON.parse(value);
      setToResponseJsonError(null);
    } catch (error) {
      setToResponseJsonError("Invalid JSON");
    }
  }

  function setTransformedData(path, value, transformedValue) {
    setSelectedFromResponse((prev) => setNestedValue(prev, path, value));
    setToResponse((prev) => setNestedValue(prev, path, transformedValue));
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <form className="space-y-4" onSubmit={handleSubmit}>
        {formError && (
          <div className="bg-red-50 border border-red-200 text-sm text-red-700 rounded-xl px-4 py-3">
            {formError}
          </div>
        )}

        <StepCard
          stepNumber={1}
          title="Choose the API Endpoint"
          currentStep={currentStep}
          isActive={currentStep === 1}
          onNext={() => setCurrentStep(2)}
          onGoToStep={() => setCurrentStep(1)}
          nextDisabled={!apiEndpoint || !fromResponse}
        >
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Api Endpoint
            </label>
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                type="url"
                className="flex-1 rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/api/endpoint"
                value={apiEndpoint}
                onChange={(event) => setApiEndpoint(event.target.value)}
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
          </div>
        </StepCard>

        <StepCard
          stepNumber={2}
          title="Generate Transformed Data Format"
          currentStep={currentStep}
          isActive={currentStep === 2}
          onGoToStep={() => setCurrentStep(2)}
          generateLabel={submitting ? "Generating..." : "Generate"}
          showGenerateButton={!toResponseText}
          nextLabel={submitting ? "Launching..." : "Launch workflow"}
          nextDisabled={submitting}
          onGenerate={handleGenerate}
          isSubmit
          footerContent={
            <div className="flex flex-wrap items-center gap-3">
              {isCancelable && (
                <button
                  type="button"
                  onClick={handleStop}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-50"
                  disabled={stopPending}
                >
                  {stopPending ? "Stopping..." : "Stop task"}
                </button>
              )}
            </div>
          }
        >
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                From response (JSON)
              </label>
              <textarea
                className="w-full mt-1 rounded-lg border border-gray-300 p-3 font-mono text-sm h-96 focus:ring-2 focus:ring-blue-500"
                value={JSON.stringify(fromResponse, null, 2)}
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                To response (JSON)
              </label>
              {toResponseJsonError && (
                <div className="mt-1 mb-1 bg-red-50 border border-red-200 text-sm text-red-700 rounded-lg px-3 py-2">
                  {toResponseJsonError}
                </div>
              )}
              <textarea
                className="w-full mt-1 rounded-lg border border-gray-300 p-3 font-mono text-sm h-96 focus:ring-2 focus:ring-blue-500"
                value={toResponseText}
                disabled={!toResponse}
                // onChange={(event) =>
                //   // handleToResponseTextChange(event.target.value)
                // }
              />
            </div>
          </div>
        </StepCard>
      </form>

      <section className="bg-white shadow rounded-2xl p-6 space-y-4">
        {!activeTask && (
          <p className="text-sm text-gray-500">
            Launch a workflow or pick one from the list below to see details.
          </p>
        )}
        {activeTask && (
          <>
            <div>
              <h3 className="text-lg font-semibold mb-2">Latest code</h3>
              <pre className="bg-gray-900 text-green-200 rounded-xl p-4 overflow-x-auto text-sm">
                {latestCode || "# awaiting generation"}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Tests</h3>
              {testResults.length === 0 && (
                <p className="text-sm text-gray-500">
                  No test results yet. Add test cases to your payload to see
                  pass/fail updates.
                </p>
              )}
              <ul className="space-y-2">
                {testResults.map((result) => (
                  <li
                    key={result.name}
                    className="border border-gray-200 rounded-xl p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{result.name}</span>
                    </div>
                    {result.error && (
                      <p className="text-sm text-red-600 mt-1">
                        {result.error}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
        {progressError && (
          <p className="text-sm text-red-600">
            Live updates unavailable: {progressError.message}
          </p>
        )}
      </section>

      <div className="grid md:grid-cols-3 gap-6">
        <section className="md:col-span-2 bg-white shadow rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Event log</h2>
            <span className="text-xs text-gray-500">
              Showing {events.length} messages
            </span>
          </div>
          {events.length === 0 && (
            <p className="text-sm text-gray-500">
              Workflow events will appear here in real time.
            </p>
          )}
          <ul className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
            {events
              .slice()
              .reverse()
              .map((event, index) => (
                <li
                  key={`${event.timestamp}-${index}`}
                  className="border border-gray-200 rounded-xl p-3"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-gray-800">
                      {event.phase || "update"}
                    </span>
                    <span className="text-gray-500">
                      {moment(event.timestamp).fromNow()}
                    </span>
                  </div>
                  {event.message && (
                    <p className="text-sm text-gray-700 mt-1">
                      {event.message}
                    </p>
                  )}
                  {event.tokens && (
                    <p className="text-xs text-gray-500 mt-1">
                      Tokens • prompt {event.tokens.prompt} / completion{" "}
                      {event.tokens.completion} / total {event.tokens.total}
                    </p>
                  )}
                  {event.output && (
                    <p className="text-sm text-gray-700 mt-1">
                      {JSON.stringify(event.output, null, 2)}
                    </p>
                  )}
                </li>
              ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
