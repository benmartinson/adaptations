import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function TestCard({
  test,
  testResult,
  endpoint,
  expectedOutput,
  fetchedData,
  isFetching,
  isRunning,
  onRun,
  isPrimary,
  taskId,
}) {
  const hasRun = !!test;
  const isPassed = testResult?.status === "passed" || test?.status === "pass";
  const isFailed = testResult?.status === "failed" || test?.status === "fail";
  const isError = testResult?.status === "error" || test?.status === "error";
  const isPending = test?.status === "pending";
  const isChangesNeeded = test?.status === "changes_needed";
  const [isUpdating, setIsUpdating] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(test?.notes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const actualOutput = testResult?.output ?? test?.actual_output;
  const errorMessage = testResult?.error ?? test?.error_message;
  const hasExpectedOutput = expectedOutput != null;

  const inputData = fetchedData ?? test?.from_response;

  const canCollapse = !isPrimary && actualOutput;
  const [isExpanded, setIsExpanded] = useState(!canCollapse);
  const navigate = useNavigate();

  function handleRun() {
    onRun();
  }

  function handleRequestChangesClick() {
    if (!isExpanded) {
      setIsExpanded(true);
    }
    setShowNotes(true);
  }

  async function handleSaveNotes() {
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
      setShowNotes(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingNotes(false);
    }
  }

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border px-4 py-3 ${
        isPassed
          ? "border-green-300"
          : isFailed
          ? "border-red-300"
          : isError
          ? "border-orange-300"
          : isPending
          ? "border-yellow-300"
          : isChangesNeeded
          ? "border-blue-300"
          : "border-gray-200"
      }`}
    >
      {/* Line 1: Expander (left) + Buttons (right) */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          {canCollapse && (
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
              {!isExpanded && (
                <span className="text-xs text-gray-500">Show Details</span>
              )}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRequestChangesClick}
            className="px-3 py-1 text-sm rounded-md font-medium cursor-pointer transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200"
          >
            Request Changes
          </button>
          {actualOutput && (
            <button
              type="button"
              onClick={() =>
                navigate(`/task/${taskId}/test/${test.id}/preview`)
              }
              className="px-3 py-1 text-sm rounded-md font-medium cursor-pointer transition-colors bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
            >
              Show Review
            </button>
          )}
          <button
            type="button"
            onClick={handleRun}
            disabled={isRunning || isFetching}
            className="px-3 py-1 text-sm rounded-md bg-gray-900 text-white font-medium hover:bg-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning
              ? "Running..."
              : isPrimary || actualOutput
              ? "Re-run Test"
              : "Run Test"}
          </button>
        </div>
      </div>

      {/* Line 2: Status badge + API endpoint */}
      <div
        className={`flex items-center gap-2 ${
          isExpanded || !canCollapse ? "mb-3" : ""
        }`}
      >
        {(hasRun && test?.status !== "created") || isPrimary ? (
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              isPassed
                ? "bg-green-100 text-green-700"
                : isFailed
                ? "bg-red-100 text-red-700"
                : isError
                ? "bg-orange-100 text-orange-700"
                : isPending
                ? "bg-yellow-100 text-yellow-700"
                : isChangesNeeded
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {isPassed
              ? "Passed"
              : isFailed
              ? "Failed"
              : isError
              ? "Error"
              : isPending
              ? "Needs Review"
              : isChangesNeeded
              ? "Changes Needed"
              : test?.status || "Created"}
          </span>
        ) : null}
        <p className="text-xs text-gray-500 truncate">
          {endpoint || "No endpoint configured"}
        </p>
      </div>

      {/* Collapsible content - always shown for primary tests, toggle for non-primary */}
      {(isExpanded || !canCollapse) && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200">
                <h4 className="text-xs font-medium text-gray-700">
                  Input Data
                </h4>
              </div>
              <div className="p-3 max-h-36 overflow-auto">
                {isFetching && (
                  <p className="text-xs text-gray-500">Fetching data...</p>
                )}
                {!isFetching && inputData && (
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                    {JSON.stringify(inputData, null, 2)?.slice(0, 1000)}
                    {JSON.stringify(inputData, null, 2)?.length > 1000 && "..."}
                  </pre>
                )}
                {!isFetching && !inputData && (
                  <p className="text-xs text-gray-500">No data available</p>
                )}
              </div>
            </div>

            <div className="border border-gray-200 rounded-md overflow-hidden">
              <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200">
                <h4 className="text-xs font-medium text-gray-700">
                  Transformed Output
                </h4>
              </div>
              <div className="p-3 max-h-36 overflow-auto">
                {actualOutput ? (
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                    {JSON.stringify(actualOutput, null, 2)?.slice(0, 1000)}
                    {JSON.stringify(actualOutput, null, 2)?.length > 1000 &&
                      "..."}
                  </pre>
                ) : (
                  <div className="flex flex-col items-center justify-center h-16 text-gray-400">
                    <svg
                      className="w-6 h-6 mb-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-xs">No output yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Expected Output - commented out
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-700">
                  Expected Output
                </h4>
                <p className="text-xs text-gray-500">
                  {hasExpectedOutput
                    ? "response_json"
                    : "none (execution only)"}
                </p>
              </div>
              <div className="p-4 max-h-48 overflow-auto">
                {hasExpectedOutput ? (
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                    {JSON.stringify(expectedOutput, null, 2)?.slice(0, 1000)}
                    {JSON.stringify(expectedOutput, null, 2)?.length > 1000 &&
                      "..."}
                  </pre>
                ) : (
                  <div className="flex flex-col items-center justify-center h-24 text-gray-400">
                    <svg
                      className="w-8 h-8 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-sm">No expected output</p>
                    <p className="text-xs">Passes if no execution error</p>
                  </div>
                )}
              </div>
            </div>
            */}
          </div>

          {/* Notes textarea - shown when requesting changes */}
          {showNotes && (
            <div className="mt-3">
              <div className="border border-gray-200 rounded-md overflow-hidden">
                <div className="bg-blue-50 px-3 py-1.5 border-b border-gray-200">
                  <h4 className="text-xs font-medium text-blue-700">Notes</h4>
                  <p className="text-xs text-blue-500">
                    In what way does the transformed output need to be changed?
                  </p>
                </div>
                <div className="p-3">
                  <textarea
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs resize-y focus:ring-0 focus:outline-none"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setShowNotes(false)}
                      className="px-3 py-1 text-sm rounded-md font-medium cursor-pointer transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNotes}
                      disabled={isSavingNotes}
                      className="px-3 py-1 text-sm rounded-md font-medium cursor-pointer transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingNotes ? "Saving..." : "Save & Request Changes"}
                    </button>
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
