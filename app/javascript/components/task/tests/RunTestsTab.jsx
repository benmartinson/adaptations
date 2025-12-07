import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RunTestsTab({
  task,
  parameters,
  tests,
  onTestCreated,
}) {
  const [testValues, setTestValues] = useState({});
  const [creatingTests, setCreatingTests] = useState({});
  const [runningTests, setRunningTests] = useState({});
  const navigate = useNavigate();

  const allParameters = parameters || [];
  const allTests = tests || [];

  function getTestForParameter(paramId) {
    return allTests.find((t) => t.parameter_id === paramId);
  }

  function handleTestValuesChange(paramId, value) {
    setTestValues((prev) => ({
      ...prev,
      [paramId]: value,
    }));
  }

  async function handleCreateTest(param) {
    const values =
      testValues[param.id] ?? (param.example_values || []).join(", ");
    const exampleValuesArray = values
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    setCreatingTests((prev) => ({ ...prev, [param.id]: true }));
    try {
      const response = await fetch(`/api/tasks/${task.id}/tests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          test: {
            parameter_id: param.id,
            example_values: exampleValuesArray,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create test");
      }

      const newTest = await response.json();
      onTestCreated?.(newTest);
    } catch (error) {
      console.error(error);
    } finally {
      setCreatingTests((prev) => ({ ...prev, [param.id]: false }));
    }
  }

  async function handleRunTest(test) {
    setRunningTests((prev) => ({ ...prev, [test.id]: true }));
    try {
      const response = await fetch(
        `/api/tasks/${task.id}/tests/${test.id}/run_job`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error("Unable to run test");
      }
      navigate(`/task/${task.id}/test/${test.id}/preview`);
    } catch (error) {
      console.error(error);
    } finally {
      setRunningTests((prev) => ({ ...prev, [test.id]: false }));
    }
  }

  function getStatusBadge(status) {
    const statusStyles = {
      created: "bg-gray-100 text-gray-600",
      pending: "bg-yellow-100 text-yellow-700",
      pass: "bg-green-100 text-green-700",
      fail: "bg-red-100 text-red-700",
      error: "bg-red-100 text-red-700",
    };

    return (
      <span
        className={`text-xs font-medium px-2 py-1 rounded ${
          statusStyles[status] || statusStyles.created
        }`}
      >
        {status}
      </span>
    );
  }

  if (allParameters.length === 0) {
    return <div className="text-center py-12 text-gray-500"></div>;
  }

  return (
    <div className="space-y-6">
      {allParameters.map((param) => {
        const existingTest = getTestForParameter(param.id);
        const currentValues =
          testValues[param.id] ??
          (existingTest?.example_values || param.example_values || []).join(
            ", "
          );
        const isCreating = creatingTests[param.id];
        const isRunning = existingTest && runningTests[existingTest.id];

        return (
          <div
            key={param.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {param.name}
              </h3>
              <div className="flex items-center gap-3">
                {existingTest ? (
                  <>
                    {getStatusBadge(existingTest.status)}
                    <button
                      type="button"
                      onClick={() => handleRunTest(existingTest)}
                      disabled={isRunning}
                      className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {isRunning ? "Running..." : "Run Test"}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleCreateTest(param)}
                    disabled={isCreating}
                    className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isCreating ? "Creating..." : "Create Test"}
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Test Values
                <span className="text-gray-400 font-normal ml-2">
                  (comma-separated)
                </span>
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                placeholder={`Enter test values for ${param.name}, separated by commas...`}
                value={currentValues}
                onChange={(e) =>
                  handleTestValuesChange(param.id, e.target.value)
                }
                disabled={!!existingTest}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
