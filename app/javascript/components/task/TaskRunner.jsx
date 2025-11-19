import React, { useEffect, useMemo, useState } from "react";
import useTaskProgress from "../../hooks/useTaskProgress";
import EndpointSelector from "./EndpointSelector";
import TransformationConfigurator from "./TransformationConfigurator";
import TaskStatus from "./TaskStatus";
import EventLog from "./EventLog";

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

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <form className="space-y-4" onSubmit={handleSubmit}>
        {formError && (
          <div className="bg-red-50 border border-red-200 text-sm text-red-700 rounded-xl px-4 py-3">
            {formError}
          </div>
        )}

        <EndpointSelector
          apiEndpoint={apiEndpoint}
          setApiEndpoint={setApiEndpoint}
          handleFetchEndpoint={handleFetchEndpoint}
          fetchingEndpoint={fetchingEndpoint}
          fromResponse={fromResponse}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
        />

        <TransformationConfigurator
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          submitting={submitting}
          toResponseText={toResponseText}
          handleGenerate={handleGenerate}
          isCancelable={isCancelable}
          handleStop={handleStop}
          stopPending={stopPending}
          fromResponse={fromResponse}
          toResponse={toResponse}
          toResponseJsonError={toResponseJsonError}
        />
      </form>

      <TaskStatus
        activeTask={activeTask}
        latestCode={latestCode}
        testResults={testResults}
        progressError={progressError}
      />

      <div className="grid md:grid-cols-3 gap-6">
        <EventLog events={events} />
      </div>
    </div>
  );
}
