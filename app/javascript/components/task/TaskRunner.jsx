import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";
import useTaskProgress from "../../hooks/useTaskProgress";
import { normalizeArray, safeParse } from "./payloadUtils";

const DEFAULT_INSTRUCTIONS =
  "Transform the Open Library data into a compact hash with work_id, cover_id, and title.";

const DEFAULT_EXAMPLES = [
  {
    label: "Sample entry",
    input: {
      entries: [
        {
          key: "/works/OL44337192W",
          covers: [9003030],
          title: "Fabeldieren & Waar Ze Te Vinden"
        }
      ]
    }
  }
];

const DEFAULT_TESTS = [
  {
    name: "Extract key fields",
    input: {
      entries: [
        {
          key: "/works/OL44337192W",
          covers: [9003030],
          title: "Fabeldieren & Waar Ze Te Vinden"
        }
      ]
    },
    expected_output: [
      {
        work_id: "OL44337192W",
        cover_id: 9003030,
        title: "Fabeldieren & Waar Ze Te Vinden"
      }
    ]
  }
];

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-900",
  running: "bg-blue-100 text-blue-900",
  completed: "bg-emerald-100 text-emerald-900",
  failed: "bg-red-100 text-red-900",
  cancelled: "bg-gray-200 text-gray-700",
  passed: "bg-emerald-100 text-emerald-900",
  error: "bg-red-100 text-red-900"
};

export default function TaskRunner() {
  const [instructions, setInstructions] = useState(DEFAULT_INSTRUCTIONS);
  const [examplesJson, setExamplesJson] = useState(
    JSON.stringify(DEFAULT_EXAMPLES, null, 2)
  );
  const [testsJson, setTestsJson] = useState(
    JSON.stringify(DEFAULT_TESTS, null, 2)
  );
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
    testResults,
    requestStop
  } = useTaskProgress(selectedTaskId);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    if (!snapshot) return;
    setTasks((prev) => {
      const filtered = prev.filter((task) => task.id !== snapshot.id);
      return [snapshot, ...filtered].slice(0, 15);
    });
  }, [snapshot]);

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

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const examples = normalizeArray(safeParse(examplesJson));
      const testCases = normalizeArray(safeParse(testsJson));

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          task: {
            kind: "code_workflow",
            input_payload: {
              instructions,
              examples,
              test_cases: testCases
            },
            metadata: {
              source: "web-ui"
            }
          }
        })
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
          "Content-Type": "application/json"
        }
      });
      await loadTasks();
    } catch (error) {
      console.error(error);
    } finally {
      setStopPending(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-semibold mb-2">
          Code Workflow Playground
        </h1>
        <p className="text-gray-600">
          Launch a long-running code generation task, stream its progress, and
          cancel it at any time.
        </p>
      </header>

      <section className="bg-white shadow rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">New workflow</h2>
          {formError && (
            <span className="text-sm text-red-600">{formError}</span>
          )}
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Instructions
            </label>
            <textarea
              className="w-full mt-1 rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Examples (JSON)
              </label>
              <textarea
                className="w-full mt-1 rounded-lg border border-gray-300 p-3 font-mono text-sm h-48 focus:ring-2 focus:ring-blue-500"
                value={examplesJson}
                onChange={(event) => setExamplesJson(event.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Test cases (JSON)
              </label>
              <textarea
                className="w-full mt-1 rounded-lg border border-gray-300 p-3 font-mono text-sm h-48 focus:ring-2 focus:ring-blue-500"
                value={testsJson}
                onChange={(event) => setTestsJson(event.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? "Launching..." : "Launch workflow"}
            </button>
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
            <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
              <span
                className={`h-2 w-2 rounded-full ${
                  connected ? "bg-emerald-500" : "bg-gray-400"
                }`}
              />
              {connected ? "Live connection" : "Offline"}
            </div>
          </div>
        </form>
      </section>

      <section className="bg-white shadow rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold">Active task</h2>
          {activeStatus && (
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[activeStatus]}`}
            >
              {activeStatus.toUpperCase()}
            </span>
          )}
          {latestPhase && (
            <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded-full">
              Phase: {latestPhase}
            </span>
          )}
        </div>
        {!activeTask && (
          <p className="text-sm text-gray-500">
            Launch a workflow or pick one from the list below to see details.
          </p>
        )}
        {activeTask && (
          <>
            <dl className="grid md:grid-cols-4 gap-4">
              <TokenCard
                label="Prompt tokens"
                value={activeTask.tokens?.prompt || 0}
              />
              <TokenCard
                label="Completion tokens"
                value={activeTask.tokens?.completion || 0}
              />
              <TokenCard
                label="Total tokens"
                value={activeTask.tokens?.total || 0}
              />
              <TokenCard
                label="Updated"
                value={
                  activeTask.last_progress_at
                    ? moment(activeTask.last_progress_at).fromNow()
                    : "—"
                }
              />
            </dl>

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
                      <StatusBadge status={result.status} />
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
                </li>
              ))}
          </ul>
        </section>

        <section className="bg-white shadow rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent tasks</h2>
            <button
              onClick={loadTasks}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Refresh
            </button>
          </div>
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li key={task.id}>
                <button
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`w-full text-left border rounded-xl px-3 py-2 flex items-center justify-between ${
                    task.id === selectedTaskId
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div>
                    <p className="font-medium text-sm">Task #{task.id}</p>
                    <p className="text-xs text-gray-500">
                      {task.created_at
                        ? moment(task.created_at).fromNow()
                        : "—"}
                    </p>
                  </div>
                  <StatusBadge status={task.status} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function TokenCard({ label, value }) {
  return (
    <div className="border border-gray-200 rounded-xl p-3">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-lg font-semibold">{value}</dd>
    </div>
  );
}

function StatusBadge({ status }) {
  if (!status) return null;
  const styles = STATUS_COLORS[status] || "bg-gray-200 text-gray-700";
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${styles}`}>
      {status.toUpperCase()}
    </span>
  );
}

