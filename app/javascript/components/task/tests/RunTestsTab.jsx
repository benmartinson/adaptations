import React, { useState, useEffect } from "react";
import { fetchEndpointData } from "../../../helpers";
import TestCard from "./TestCard";

export default function RunTestsTab({
  transformCode,
  responseJson,
  apiEndpoint,
  taskId,
  testResults,
  tests,
  isRunningTests,
}) {
  const [runningTestId, setRunningTestId] = useState(null);
  const [newTestEndpoint, setNewTestEndpoint] = useState("");
  const [showAddTest, setShowAddTest] = useState(false);
  const [fetchedDataMap, setFetchedDataMap] = useState({});
  const [fetchingEndpoints, setFetchingEndpoints] = useState({});

  // Fetch data for the main endpoint on mount
  useEffect(() => {
    if (!apiEndpoint) return;
    fetchDataForEndpoint(apiEndpoint);
  }, [apiEndpoint]);

  async function fetchDataForEndpoint(endpoint) {
    if (fetchedDataMap[endpoint] || fetchingEndpoints[endpoint]) return;

    setFetchingEndpoints((prev) => ({ ...prev, [endpoint]: true }));
    try {
      const data = await fetchEndpointData(endpoint);
      setFetchedDataMap((prev) => ({ ...prev, [endpoint]: data }));
    } catch (error) {
      console.error(error);
    } finally {
      setFetchingEndpoints((prev) => ({ ...prev, [endpoint]: false }));
    }
  }

  async function handleRunTest({
    test = null,
    endpoint,
    expectedOutput = null,
    isNewTest = false,
  }) {
    let fetchedData = fetchedDataMap[endpoint];

    // If no data yet, fetch it first
    if (!fetchedData) {
      await fetchDataForEndpoint(endpoint);
      fetchedData = fetchedDataMap[endpoint];
      if (!fetchedData) return;
    }

    setRunningTestId(test?.id || "new");
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
            api_endpoint: endpoint,
            from_response: fetchedData,
            expected_output: expectedOutput,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to run tests");
      }

      if (isNewTest) {
        setShowAddTest(false);
        setNewTestEndpoint("");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setRunningTestId(null);
    }
  }

  // Show all tests - tests array is already ordered by created_at desc from the API
  const allTests = tests || [];

  return (
    <div className="space-y-6">
      {/* Add Test Section - at top */}
      {showAddTest ? (
        <div className="bg-white rounded-xl shadow-sm border border-dashed border-gray-300 p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Add New Test
          </h4>
          <div className="flex gap-3">
            <input
              type="url"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={apiEndpoint || "Enter API endpoint URL"}
              value={newTestEndpoint}
              onChange={(e) => setNewTestEndpoint(e.target.value)}
            />
            <button
              type="button"
              onClick={() =>
                handleRunTest({
                  endpoint: newTestEndpoint || apiEndpoint,
                  expectedOutput: null,
                  isNewTest: true,
                })
              }
              disabled={runningTestId === "new"}
              className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {runningTestId === "new" ? "Running..." : "Run Test"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddTest(false);
                setNewTestEndpoint("");
              }}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            This test will run without expected output validation - it passes if
            the transform executes without errors.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddTest(true)}
          className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Test
        </button>
      )}

      {/* All Test Cards */}
      {allTests.map((test, index) => (
        <TestCard
          key={test.id}
          test={test}
          testResult={testResults?.find((r) => r.test_id === test.id)}
          endpoint={test.api_endpoint}
          expectedOutput={test.expected_output}
          fetchedData={fetchedDataMap[test.api_endpoint]}
          isFetching={fetchingEndpoints[test.api_endpoint]}
          isRunning={runningTestId === test.id}
          onRun={() =>
            handleRunTest({
              test,
              endpoint: test.api_endpoint,
              expectedOutput: test.expected_output,
            })
          }
          isPrimary={index === 0}
        />
      ))}

      {/* Show a default card if no tests exist yet */}
      {allTests.length === 0 && (
        <TestCard
          test={null}
          endpoint={apiEndpoint}
          expectedOutput={responseJson}
          fetchedData={fetchedDataMap[apiEndpoint]}
          isFetching={fetchingEndpoints[apiEndpoint]}
          isRunning={runningTestId === "new"}
          onRun={() =>
            handleRunTest({
              endpoint: apiEndpoint,
              expectedOutput: responseJson,
              isNewTest: true,
            })
          }
          isPrimary
        />
      )}
    </div>
  );
}
