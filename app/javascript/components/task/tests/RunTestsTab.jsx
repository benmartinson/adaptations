import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { fetchEndpointData } from "../../../helpers";
import TestCard from "./TestCard";
import AutomatedTests from "./AutomatedTests";

export default function RunTestsTab({ task, tests, onTestCreated }) {
  const location = useLocation();
  const expandTestId = location.state?.expandTestId;
  const focusNotes = location.state?.focusNotes;
  const [activeTab, setActiveTab] = useState("manual");
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
  const hasAutomatedTests = allTests.some((t) => t.test_type === "automated");

  // Switch to automated tab if automated tests exist
  useEffect(() => {
    if (hasAutomatedTests) {
      setActiveTab("automated");
    }
  }, [hasAutomatedTests]);

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
  const hasChangesNeeded = allTests.some((t) => t.status === "changes_needed");

  return (
    <div className="space-y-3">
      {/* Tab Switcher */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("manual")}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
            activeTab === "manual"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Manual
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("automated")}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
            activeTab === "automated"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Automated
        </button>
      </div>

      {activeTab === "automated" && (
        <AutomatedTests
          tests={allTests}
          task={task}
          fetchedDataMap={fetchedDataMap}
          fetchingEndpoints={fetchingEndpoints}
          runningTestIds={runningTestIds}
          onRunTest={runTest}
        />
      )}

      {activeTab === "manual" && (
        <>
          {/* Header row with Add Test and Re-Generate buttons */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowAddTest(!showAddTest)}
              className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer flex items-center gap-1"
            >
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Test
            </button>
            <button
              type="button"
              disabled={!hasChangesNeeded}
              className="px-3  py-1 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              Re-Generate Transformation
            </button>
          </div>

          {showAddTest && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex gap-3">
                <input
                  type="url"
                  className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:ring-0 focus:outline-none"
                  placeholder={apiEndpoint || "Enter API endpoint URL"}
                  value={newTestEndpoint}
                  onChange={(e) => setNewTestEndpoint(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleAddTest}
                  disabled={isAddingTest}
                  className="px-3 py-1.5 text-sm rounded-md bg-gray-900 text-white font-medium hover:bg-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingTest ? "Adding..." : "Add"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTest(false);
                    setNewTestEndpoint("");
                  }}
                  className="px-3 py-1.5 text-sm rounded-md bg-gray-100 text-gray-700 font-medium hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
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
              initialExpanded={expandTestId === test.id}
              focusNotes={expandTestId === test.id && focusNotes}
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
              initialExpanded={expandTestId === primaryTest.id}
              focusNotes={expandTestId === primaryTest.id && focusNotes}
            />
          )}
        </>
      )}
    </div>
  );
}
