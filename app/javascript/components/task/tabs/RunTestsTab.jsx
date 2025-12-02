import React, { useState, useEffect } from "react";
import { fetchEndpointData } from "../../../helpers";

export default function RunTestsTab({
  transformCode,
  responseJson,
  apiEndpoint,
  taskId,
  testResults,
  tests,
  isRunningTests,
}) {
  const [runningTest, setRunningTest] = useState(false);
  const [fetchedData, setFetchedData] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  const latestTest = tests?.[0];
  const latestResult = testResults?.[0];
  console.log({ latestTest, testResults });

  const hasRun = !!latestTest || !!latestResult;
  const isPassed =
    latestResult?.status === "passed" || latestTest?.status === "pass";
  const isFailed =
    latestResult?.status === "failed" || latestTest?.status === "fail";
  const isError = latestResult?.status === "error";
  const isPending = latestTest?.status === "pending" && !latestResult;

  const actualOutput = latestResult?.output ?? latestTest?.actual_output;
  const expectedOutput =
    latestResult?.expected_output ?? latestTest?.expected_output;
  const errorMessage = latestResult?.error ?? latestTest?.error_message;

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

  const testApiEndpoint = latestTest?.api_endpoint || apiEndpoint;

  return (
    <div className="space-y-6">
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
            <p className="text-sm text-gray-500 mt-1 truncate max-w-md">
              {testApiEndpoint || "No endpoint configured"}
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
                  : latestTest?.status || latestResult?.status}
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
              <p className="text-xs text-gray-500">from_response</p>
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
                {JSON.stringify(expectedOutput || responseJson, null, 2)?.slice(
                  0,
                  1000
                )}
                {JSON.stringify(expectedOutput || responseJson, null, 2)
                  ?.length > 1000 && "..."}
              </pre>
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
                    {isPassed && (
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
    </div>
  );
}
