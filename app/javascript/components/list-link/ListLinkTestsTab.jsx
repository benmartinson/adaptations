import React, { useState } from "react";

export default function ListLinkTestsTab({
  fromResponse,
  transformCode,
  tests,
  taskId,
  onTestCreated,
  onTestUpdate,
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);

  // Get the list items from fromResponse
  const listItems = Array.isArray(fromResponse)
    ? fromResponse
    : Array.isArray(fromResponse?.items)
    ? fromResponse.items
    : [];

  // Placeholder for running the transform on all items
  async function handleRunTests() {
    setIsRunning(true);
    // TODO: Backend integration - run transform_code on each list item
    // For now, just simulate a delay
    setTimeout(() => {
      setIsRunning(false);
      // Placeholder results - in real implementation, this would come from backend
      setResults(
        listItems.map((item, index) => ({
          item,
          endpoint: `Generated endpoint for item ${index + 1}`,
          status: "pending",
        }))
      );
    }, 1000);
  }

  return (
    <div className="space-y-4">
      {/* Header with Run Tests button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          List Link Test Results
        </h3>
        <button
          type="button"
          onClick={handleRunTests}
          disabled={isRunning || !transformCode}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isRunning ? (
            <>
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
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Running...
            </>
          ) : (
            <>
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
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Run Tests
            </>
          )}
        </button>
      </div>

      {/* Two-column layout */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-gray-200">
          {/* Left Column: From Response List */}
          <div>
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-700">
                From Response List
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                {listItems.length} items in the source list
              </p>
            </div>
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {listItems.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No items in source list
                </div>
              ) : (
                listItems.map((item, index) => (
                  <div key={index} className="p-3">
                    <div className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-medium flex items-center justify-center">
                        {index + 1}
                      </span>
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-x-auto flex-1 max-h-24 overflow-y-auto bg-gray-50 p-2 rounded">
                        {JSON.stringify(item, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Generated Endpoints */}
          <div>
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-700">
                Generated Endpoints
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                API endpoint URLs generated by transform code
              </p>
            </div>
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {!results ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  <svg
                    className="w-8 h-8 mx-auto mb-2 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <p>Click "Run Tests" to generate endpoints</p>
                </div>
              ) : (
                results.map((result, index) => (
                  <div key={index} className="p-3">
                    <div className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-gray-400 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                            />
                          </svg>
                          <code className="text-xs text-gray-700 break-all bg-gray-50 px-2 py-1 rounded flex-1">
                            {result.endpoint}
                          </code>
                        </div>
                        {result.status === "success" && (
                          <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Success
                          </span>
                        )}
                        {result.status === "error" && (
                          <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Error
                          </span>
                        )}
                        {result.status === "pending" && (
                          <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              This test view shows how the transform code converts each item
              from the source list into an API endpoint URL. The generated
              endpoints can then be used to fetch detailed data for each item.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

