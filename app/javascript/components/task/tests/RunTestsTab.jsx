import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { fetchEndpointData } from "../../../helpers";
import TestCard from "./TestCard";
import LinkTestCard from "./LinkTestCard";
import AutomatedTests from "./AutomatedTests";

export default function RunTestsTab({
  task,
  tests,
  onTestCreated,
  onTestUpdate,
  onRegenerateTransform,
  isLinkTask = false,
  allTasks,
  fromSystemTag,
}) {
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
  const [isRunningAll, setIsRunningAll] = useState(false);
  const fromTask = isLinkTask
    ? allTasks?.find((t) => t.system_tag === fromSystemTag)
    : task;

  const apiEndpoint = task?.api_endpoint;
  const responseJson = task?.response_json;

  const allTests = tests || [];
  const primaryTest = allTests.find((t) => t.is_primary);

  const CardComponent = isLinkTask ? LinkTestCard : TestCard;

  useEffect(() => {
    if (!apiEndpoint) return;
    fetchDataForEndpoint(apiEndpoint);
  }, [apiEndpoint]);

  // Auto-create primary test if none exists
  useEffect(() => {
    console.log({
      primaryTest,
      task,
      fromTask,
      result: !primaryTest && task?.id && fromTask,
    });
    if (!primaryTest && task?.id && fromTask) {
      createTest(fromTask?.api_endpoint, true);
    }
  }, [primaryTest, task?.id, fromTask, isLinkTask, allTasks]);

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

  async function runAllTests() {
    if (allTests.length === 0) return;

    setIsRunningAll(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}/run_tests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Unable to run tests");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsRunningAll(false);
    }
  }

  async function createTest(
    endpoint,
    isPrimary = false,
    customFromEndpoint = null
  ) {
    let testData;

    if (isLinkTask) {
      const fromTask = allTasks?.find((t) => t.system_tag === fromSystemTag);

      testData = {
        api_endpoint: fromTask?.api_endpoint,
        from_response: customFromEndpoint || fromTask?.api_endpoint,
        is_primary: isPrimary,
      };
    } else {
      const data = await fetchEndpointData(endpoint);
      if (!data) return null;

      testData = {
        api_endpoint: endpoint,
        from_response: JSON.stringify(data),
        is_primary: isPrimary,
      };
    }

    const response = await fetch(`/api/tasks/${task.id}/tests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test: testData }),
    });

    if (!response.ok) return null;
    const newTest = await response.json();
    onTestCreated?.(newTest);
    // Automatically run the test after creation
    runTest(newTest.id);
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
      if (isLinkTask) {
        // For link tasks, pass the entered endpoint as customFromEndpoint
        await createTest(null, false, newTestEndpoint);
      } else {
        // For regular tasks, use the normal flow
        await createTest(newTestEndpoint || apiEndpoint, false);
      }
      setShowAddTest(false);
      setNewTestEndpoint("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsAddingTest(false);
    }
  }

  const otherTests = allTests
    .filter((t) => !t.is_primary && t.test_type !== "automated")
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const hasChangesNeeded = allTests.some((t) => t.status === "changes_needed");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
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
        <div className="flex items-center gap-2">
          {activeTab === "manual" && (
            <button
              type="button"
              onClick={() => setShowAddTest(!showAddTest)}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer flex items-center gap-1.5 transition-colors"
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
          )}
          <button
            type="button"
            onClick={runAllTests}
            disabled={isRunningAll || allTests.length === 0}
            className="px-3 py-1.5 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {isRunningAll ? "Running..." : "Run All Tests"}
          </button>
          <div className="relative group">
            <button
              type="button"
              disabled={!hasChangesNeeded}
              onClick={onRegenerateTransform}
              className="px-3 py-1.5 rounded-md bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              Re-Generate Transformation
            </button>
            {!hasChangesNeeded && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                No tests have requested changes
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeTab === "automated" && (
        <AutomatedTests
          tests={allTests}
          task={task}
          fetchedDataMap={fetchedDataMap}
          fetchingEndpoints={fetchingEndpoints}
          runningTestIds={runningTestIds}
          onRunTest={runTest}
          onTestUpdate={onTestUpdate}
        />
      )}

      {activeTab === "manual" && (
        <>
          {showAddTest && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex gap-3">
                <input
                  type="url"
                  className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:ring-0 focus:outline-none"
                  placeholder={
                    isLinkTask
                      ? `Enter API endpoint URL that the \'${fromTask?.system_tag}\' process handles`
                      : apiEndpoint || "Enter API endpoint URL"
                  }
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
            <CardComponent
              key={test.id}
              test={test}
              testResult={test}
              {...(isLinkTask
                ? {
                    fromEndpoint: test.from_response,
                  }
                : {
                    endpoint: test.api_endpoint,
                    expectedOutput: test.expected_output,
                    fetchedData: fetchedDataMap[test.api_endpoint],
                    isFetching: fetchingEndpoints[test.api_endpoint],
                  })}
              isRunning={runningTestIds.includes(test.id)}
              onRun={() => runTest(test.id)}
              onTestUpdate={onTestUpdate}
              isPrimary={false}
              taskId={task?.id}
              initialExpanded={expandTestId === test.id}
              focusNotes={expandTestId === test.id && focusNotes}
              onRegenerateTransform={onRegenerateTransform}
            />
          ))}

          {primaryTest && (
            <CardComponent
              key={primaryTest.id}
              test={primaryTest}
              testResult={primaryTest}
              {...(isLinkTask
                ? {
                    fromEndpoint: primaryTest.from_response,
                  }
                : {
                    endpoint: primaryTest.api_endpoint,
                    expectedOutput: responseJson,
                    fetchedData: fetchedDataMap[primaryTest.api_endpoint],
                    isFetching: fetchingEndpoints[primaryTest.api_endpoint],
                  })}
              isRunning={runningTestIds.includes(primaryTest.id)}
              onRun={() => runTest(primaryTest.id)}
              onTestUpdate={onTestUpdate}
              isPrimary
              taskId={task?.id}
              initialExpanded={expandTestId === primaryTest.id}
              focusNotes={expandTestId === primaryTest.id && focusNotes}
              onRegenerateTransform={onRegenerateTransform}
            />
          )}
        </>
      )}
    </div>
  );
}
