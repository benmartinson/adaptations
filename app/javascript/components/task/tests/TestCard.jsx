import React from "react";

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
}) {
  const hasRun = !!test;
  const isPassed = testResult?.status === "passed" || test?.status === "pass";
  const isFailed = testResult?.status === "failed" || test?.status === "fail";
  const isError = testResult?.status === "error" || test?.status === "error";
  const isPending = test?.status === "pending" && !testResult;

  const actualOutput = testResult?.output ?? test?.actual_output;
  const errorMessage = testResult?.error ?? test?.error_message;
  const hasExpectedOutput = expectedOutput != null;

  // Use fetchedData (fresh from API) or fall back to stored from_response
  const inputData = fetchedData ?? test?.from_response;

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border p-6 ${
        isPassed
          ? "border-green-300"
          : isFailed
          ? "border-red-300"
          : isError
          ? "border-orange-300"
          : "border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500 truncate max-w-md">
            {endpoint || "No endpoint configured"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasRun && test?.status !== "created" && (
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                isPassed
                  ? "bg-green-100 text-green-700"
                  : isFailed
                  ? "bg-red-100 text-red-700"
                  : isError
                  ? "bg-orange-100 text-orange-700"
                  : isPending
                  ? "bg-yellow-100 text-yellow-700"
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
                ? "Pending"
                : test?.status}
            </span>
          )}
          <button
            type="button"
            onClick={onRun}
            disabled={isRunning || isFetching}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? "Running..." : "Run Test"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-700">Input Data</h4>
            <p className="text-xs text-gray-500">from_response</p>
          </div>
          <div className="p-4 max-h-48 overflow-auto">
            {isFetching && (
              <p className="text-sm text-gray-500">Fetching data...</p>
            )}
            {!isFetching && inputData && (
              <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                {JSON.stringify(inputData, null, 2)?.slice(0, 1000)}
                {JSON.stringify(inputData, null, 2)?.length > 1000 && "..."}
              </pre>
            )}
            {!isFetching && !inputData && (
              <p className="text-sm text-gray-500">No data available</p>
            )}
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-700">
              Expected Output
            </h4>
            <p className="text-xs text-gray-500">
              {hasExpectedOutput ? "response_json" : "none (execution only)"}
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
      </div>

      {/* Actual Output - only shown after test has run */}
      {hasRun && (
        <div className="mt-4">
          {isError && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-700 font-medium">
                Error during execution
              </p>
              <p className="text-sm text-orange-600 mt-1">{errorMessage}</p>
            </div>
          )}

          {isPending && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-700 font-medium">
                Test is running...
              </p>
            </div>
          )}

          {(isPassed || isFailed) && (
            <div
              className={`border rounded-lg overflow-hidden ${
                isPassed ? "border-green-200" : "border-red-200"
              }`}
            >
              <div
                className={`px-4 py-2 border-b ${
                  isPassed
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <h4
                  className={`text-sm font-medium ${
                    isPassed ? "text-green-700" : "text-red-700"
                  }`}
                >
                  Actual Output
                  {isFailed && (
                    <span className="ml-2 text-xs font-normal">
                      (differs from expected)
                    </span>
                  )}
                  {isPassed && !hasExpectedOutput && (
                    <span className="ml-2 text-xs font-normal">
                      (executed successfully)
                    </span>
                  )}
                  {isPassed && hasExpectedOutput && (
                    <span className="ml-2 text-xs font-normal">
                      (matches expected)
                    </span>
                  )}
                </h4>
              </div>
              <div className="p-4 max-h-48 overflow-auto bg-white">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                  {JSON.stringify(actualOutput, null, 2)?.slice(0, 1000)}
                  {JSON.stringify(actualOutput, null, 2)?.length > 1000 &&
                    "..."}
                </pre>
              </div>
            </div>
          )}

          {isFailed && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700 font-medium">
                Test failed: Output does not match expected response_json
              </p>
              <p className="text-sm text-red-600 mt-1">
                Review the differences above and regenerate the transform code
                if needed.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
