import React, { useState, useEffect } from "react";
import { fetchEndpointData } from "../../../helpers";

export default function RunTestsTab({
  transformCode,
  responseJson,
  apiEndpoint,
  taskId,
  testResults,
  isRunningTests,
}) {
  const [runningTest, setRunningTest] = useState(false);
  const [fetchedData, setFetchedData] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  const latestResult = testResults?.[0];
  const hasRun = !!latestResult;
  const isPassed = latestResult?.status === "passed";
  const isFailed = latestResult?.status === "failed";
  const isError = latestResult?.status === "error";

  // Fetch data from the API endpoint when the tab loads
  useEffect(() => {
    if (!apiEndpoint) return;

    async function fetchData() {
      setIsFetching(true);
      setFetchError(null);
      try {
        const data = await fetchEndpointData(apiEndpoint);
        setFetchedData(data);
      } catch (error) {
        console.error(error);
        setFetchError(error.message);
      } finally {
        setIsFetching(false);
      }
    }

    fetchData();
  }, [apiEndpoint]);

  async function handleRunTest() {
    if (runningTest || isRunningTests || !fetchedData) return;

    setRunningTest(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/run_job`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: {
            input_payload: {
              task_type: "run_transform_tests",
            },
          },
          test: {
            api_endpoint: apiEndpoint,
            from_response: fetchedData,
            expected_output: responseJson,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to run tests");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setRunningTest(false);
    }
  }

  const isLoading = runningTest || isRunningTests;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Transform API Response
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Run the generated transform code against the fetched API data
            </p>
          </div>
          <div className="flex items-center gap-3">
            {hasRun && (
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isPassed
                    ? "bg-green-100 text-green-700"
                    : isFailed
                    ? "bg-red-100 text-red-700"
                    : isError
                    ? "bg-orange-100 text-orange-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {isPassed
                  ? "Passed"
                  : isFailed
                  ? "Failed"
                  : isError
                  ? "Error"
                  : latestResult?.status}
              </span>
            )}
            <button
              type="button"
              onClick={handleRunTest}
              disabled={isLoading || isFetching || !fetchedData}
              className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Running..." : "Run Test"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-700">Input Data</h4>
              <p className="text-xs text-gray-500">
                Fresh data from{" "}
                {apiEndpoint ? new URL(apiEndpoint).hostname : "API"}
              </p>
            </div>
            <div className="p-4 max-h-48 overflow-auto">
              {isFetching && (
                <p className="text-sm text-gray-500">Fetching data...</p>
              )}
              {fetchError && (
                <p className="text-sm text-red-600">Error: {fetchError}</p>
              )}
              {!isFetching && !fetchError && fetchedData && (
                <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                  {JSON.stringify(fetchedData, null, 2)?.slice(0, 1000)}
                  {JSON.stringify(fetchedData, null, 2)?.length > 1000 && "..."}
                </pre>
              )}
              {!isFetching && !fetchError && !fetchedData && (
                <p className="text-sm text-gray-500">No data fetched yet</p>
              )}
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-700">
                Expected Output
              </h4>
              <p className="text-xs text-gray-500">response_json</p>
            </div>
            <div className="p-4 max-h-48 overflow-auto">
              <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                {JSON.stringify(responseJson, null, 2)?.slice(0, 1000)}
                {JSON.stringify(responseJson, null, 2)?.length > 1000 && "..."}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {hasRun && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Test Results
          </h3>

          {isError && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-orange-700 font-medium">
                Error during execution
              </p>
              <p className="text-sm text-orange-600 mt-1">
                {latestResult?.error}
              </p>
            </div>
          )}

          {(isPassed || isFailed) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Expected Output */}
              <div
                className={`border rounded-lg overflow-hidden ${
                  isPassed ? "border-green-200" : "border-gray-200"
                }`}
              >
                <div
                  className={`px-4 py-2 border-b ${
                    isPassed
                      ? "bg-green-50 border-green-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <h4
                    className={`text-sm font-medium ${
                      isPassed ? "text-green-700" : "text-gray-700"
                    }`}
                  >
                    Expected Output
                  </h4>
                </div>
                <div className="p-4 max-h-64 overflow-auto bg-white">
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                    {JSON.stringify(latestResult?.expected_output, null, 2)}
                  </pre>
                </div>
              </div>

              <div
                className={`border rounded-lg overflow-hidden ${
                  isPassed
                    ? "border-green-200"
                    : isFailed
                    ? "border-red-200"
                    : "border-gray-200"
                }`}
              >
                <div
                  className={`px-4 py-2 border-b ${
                    isPassed
                      ? "bg-green-50 border-green-200"
                      : isFailed
                      ? "bg-red-50 border-red-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <h4
                    className={`text-sm font-medium ${
                      isPassed
                        ? "text-green-700"
                        : isFailed
                        ? "text-red-700"
                        : "text-gray-700"
                    }`}
                  >
                    Actual Output
                    {isFailed && (
                      <span className="ml-2 text-xs font-normal">
                        (differs from expected)
                      </span>
                    )}
                  </h4>
                </div>
                <div className="p-4 max-h-64 overflow-auto bg-white">
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                    {JSON.stringify(latestResult?.output, null, 2)}
                  </pre>
                </div>
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

          {isPassed && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700 font-medium">
                Test passed! Output matches expected response_json
              </p>
              <p className="text-sm text-green-600 mt-1">
                The transform code is working correctly. You can proceed to
                deploy.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
