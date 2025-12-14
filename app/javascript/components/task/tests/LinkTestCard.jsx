import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "./StatusBadge";

export default function LinkTestCard({
  test,
  testResult,
  fromEndpoint,
  toEndpoint,
  isRunning,
  onRun,
  onTestUpdate,
  isPrimary,
  taskId,
  initialExpanded,
  focusNotes,
}) {
  const notesRef = useRef(null);
  const hasRun = !!test;
  const isError = testResult?.status === "error" || test?.status === "error";
  const [notes, setNotes] = useState(test?.notes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [showInstructionMessage, setShowInstructionMessage] = useState(false);
  const [hasRequestedChanges, setHasRequestedChanges] = useState(
    test?.status === "changes_needed"
  );

  useEffect(() => {
    setHasRequestedChanges(test?.status === "changes_needed");
  }, [test?.status]);

  useEffect(() => {
    if (test?.notes !== undefined) {
      setNotes(test.notes || "");
    }
  }, [test?.notes]);

  const actualOutput = testResult?.output ?? test?.actual_output;
  const errorMessage = testResult?.error ?? test?.error_message;

  const canCollapse = !isPrimary && actualOutput;
  const [isExpanded, setIsExpanded] = useState(!canCollapse || initialExpanded);
  const navigate = useNavigate();

  useEffect(() => {
    if (focusNotes && notesRef.current) {
      setTimeout(() => {
        notesRef.current?.focus();
        notesRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  }, [focusNotes]);

  function handleRun() {
    onRun();
  }

  async function handleRequestChanges() {
    setIsSavingNotes(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/tests/${test.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: { status: "changes_needed", notes } }),
      });
      if (!response.ok) {
        throw new Error("Unable to update test");
      }
      const updatedTest = await response.json();
      onTestUpdate?.(updatedTest);
      setHasRequestedChanges(true);
      setShowSavedMessage(true);
      setShowInstructionMessage(true);
      setTimeout(() => {
        setShowSavedMessage(false);
        setShowInstructionMessage(false);
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingNotes(false);
    }
  }

  async function handleNotesBlur() {
    if (!hasRequestedChanges || !notes) return;

    setIsSavingNotes(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/tests/${test.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: { notes } }),
      });
      if (!response.ok) {
        throw new Error("Unable to update notes");
      }
      const updatedTest = await response.json();
      onTestUpdate?.(updatedTest);
      setShowSavedMessage(true);
      setTimeout(() => setShowSavedMessage(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingNotes(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border px-4 py-3 border-gray-200">
      {/* Primary test message */}
      {isPrimary && (
        <div className="mb-2 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md">
          <p className="text-xs text-slate-600">
            This test was created automatically based on initial configuration.
          </p>
        </div>
      )}

      {/* Line 1: Status badge + Link description + Buttons */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {(hasRun && test?.status !== "created") || isPrimary ? (
            <StatusBadge
              status={testResult?.status || test?.status}
              size="sm"
            />
          ) : null}
          <p className="text-xs text-gray-500 truncate">
            Link transformation test
          </p>
        </div>
        <div className="flex items-center gap-2">
          {actualOutput && (
            <button
              type="button"
              onClick={() =>
                navigate(`/link/${taskId}/tests/preview`, {
                  state: { testId: test.id },
                })
              }
              className="px-3 py-1 text-sm rounded-md font-medium cursor-pointer transition-colors bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
            >
              Review
            </button>
          )}
          <button
            type="button"
            onClick={handleRun}
            disabled={isRunning}
            className="p-1.5 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Run test"
          >
            {isRunning ? (
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Line 2: Show Details expander */}
      {canCollapse && (
        <div className={`${isExpanded ? "mb-3" : ""}`}>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 p-0.5 rounded hover:bg-gray-100 transition-colors"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${
                isExpanded ? "rotate-90" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span className="text-xs text-gray-500">
              {isExpanded ? "Hide Details" : "Show Details"}
            </span>
          </button>
        </div>
      )}

      {/* Collapsible content - always shown for primary tests, toggle for non-primary */}
      {(isExpanded || !canCollapse) && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200">
                <h4 className="text-xs font-medium text-gray-700">
                  From API Endpoint
                </h4>
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"
                    />
                  </svg>
                  <code className="text-xs text-gray-600 break-all">
                    {fromEndpoint || "No endpoint configured"}
                  </code>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-md overflow-hidden">
              <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200">
                <h4 className="text-xs font-medium text-gray-700">
                  To API Endpoint
                </h4>
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"
                    />
                  </svg>
                  <code className="text-xs text-gray-600 break-all">
                    {toEndpoint || "No endpoint configured"}
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Notes textarea - shown when requesting changes (not for primary tests) */}
          {!isPrimary && (
            <div className="mt-3">
              <div className="border border-gray-200 rounded-md overflow-hidden">
                <div className="bg-blue-50 px-3 py-1.5 border-b border-gray-200">
                  <h4 className="text-xs font-medium text-blue-700">Notes</h4>
                  <p className="text-xs text-blue-500">
                    In what way does the link transformation need to be
                    different?
                  </p>
                </div>
                <div className="p-3">
                  <textarea
                    ref={notesRef}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs resize-y focus:ring-0 focus:outline-none"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={handleNotesBlur}
                    rows={3}
                  />
                  <div className="flex justify-end items-center gap-2 mt-2">
                    {showSavedMessage && (
                      <span className="text-sm text-green-600 font-medium">
                        Saved!
                      </span>
                    )}
                    {showInstructionMessage && (
                      <span className="text-sm text-gray-600 font-medium ml-1">
                        Click 'Re-Generate Transformation' to update the
                        transformation code.
                      </span>
                    )}
                    {!hasRequestedChanges && (
                      <button
                        type="button"
                        onClick={handleRequestChanges}
                        disabled={isSavingNotes || !notes}
                        className="px-3 py-1 text-sm rounded-md font-medium cursor-pointer transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSavingNotes ? "Saving..." : "Request Changes"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error message - shown when test has error */}
          {hasRun && isError && (
            <div className="mt-3">
              <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                <p className="text-xs text-orange-700 font-medium">
                  Error during execution
                </p>
                <p className="text-xs text-orange-600 mt-1">{errorMessage}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
