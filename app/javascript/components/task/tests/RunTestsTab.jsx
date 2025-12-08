import React, { useState, useEffect, useRef } from "react";
import { fetchEndpointData } from "../../../helpers";
import TestCard from "./TestCard";

export default function RunTestsTab({ task, tests, onTestCreated }) {
  const [runningTestIds, setRunningTestIds] = useState([]);
  const [newTestEndpoint, setNewTestEndpoint] = useState("");
  const [showAddTest, setShowAddTest] = useState(false);
  const [fetchedDataMap, setFetchedDataMap] = useState({});
  const [fetchingEndpoints, setFetchingEndpoints] = useState({});
  const [isAddingTest, setIsAddingTest] = useState(false);
  const [isCreatingPrimary, setIsCreatingPrimary] = useState(false);
  const primaryTestCreatedRef = useRef(false);

  const apiEndpoint = task?.api_endpoint;
  const responseJson = task?.response_json;

  const allTests = tests || [];
  const primaryTest = allTests.find((t) => t.is_primary);

  useEffect(() => {
    if (!apiEndpoint) return;
    fetchDataForEndpoint(apiEndpoint);
  }, [apiEndpoint]);

  // Auto-create and run primary test if none exists
  useEffect(() => {
    if (
      !primaryTestCreatedRef.current &&
      !primaryTest &&
      apiEndpoint &&
      responseJson &&
      task?.id
    ) {
      primaryTestCreatedRef.current = true;
      createAndRunPrimaryTest();
    }
  }, [primaryTest, apiEndpoint, responseJson, task?.id]);

  async function createAndRunPrimaryTest() {
    setIsCreatingPrimary(true);
    try {
      const newTest = await createTest(apiEndpoint, responseJson, true);
      if (newTest) {
        await runTest(newTest.id);
      }
    } catch (error) {
      console.error("Error creating primary test:", error);
    } finally {
      setIsCreatingPrimary(false);
    }
  }

  async function runTest(testId) {
    setRunningTestIds((prev) => [...prev, testId]);
    try {
      const response = await fetch(
        `/api/tasks/${task.id}/tests/${testId}/run_job`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error("Unable to run test");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setRunningTestIds((prev) => prev.filter((id) => id !== testId));
    }
  }

  async function createTest(endpoint, expectedOutput, isPrimary = false) {
    const data = await fetchEndpointData(endpoint);
    if (!data) return null;

    const response = await fetch(`/api/tasks/${task.id}/tests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        test: {
          api_endpoint: endpoint,
          from_response: data,
          expected_output: expectedOutput,
          is_primary: isPrimary,
        },
      }),
    });

    if (!response.ok) return null;
    const newTest = await response.json();
    onTestCreated?.(newTest);
    return newTest;
  }

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

  async function handleAddTest() {
    setIsAddingTest(true);
    try {
      await createTest(newTestEndpoint || apiEndpoint, null, false);
      setShowAddTest(false);
      setNewTestEndpoint("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsAddingTest(false);
    }
  }

  const otherTests = allTests.filter((t) => !t.is_primary);

  return (
    <div className="space-y-6">
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
              onClick={handleAddTest}
              disabled={isAddingTest}
              className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAddingTest ? "Adding..." : "Add Test"}
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

      {otherTests.map((test) => (
        <TestCard
          key={test.id}
          test={test}
          testResult={test}
          endpoint={test.api_endpoint}
          expectedOutput={test.expected_output}
          fetchedData={fetchedDataMap[test.api_endpoint]}
          isFetching={fetchingEndpoints[test.api_endpoint]}
          isRunning={runningTestIds.includes(test.id)}
          onRun={() => runTest(test.id)}
          isPrimary={false}
          taskId={task.id}
        />
      ))}

      {isCreatingPrimary && !primaryTest && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
            <span className="text-gray-600">
              Creating and running primary test...
            </span>
          </div>
        </div>
      )}

      {primaryTest && (
        <TestCard
          key={primaryTest.id}
          test={primaryTest}
          testResult={primaryTest}
          endpoint={primaryTest.api_endpoint}
          expectedOutput={responseJson}
          fetchedData={fetchedDataMap[primaryTest.api_endpoint]}
          isFetching={fetchingEndpoints[primaryTest.api_endpoint]}
          isRunning={runningTestIds.includes(primaryTest.id)}
          onRun={() => runTest(primaryTest.id)}
          isPrimary
          taskId={task.id}
        />
      )}
    </div>
  );
}
