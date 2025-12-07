import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RunTestsTab({
  task,
  parameters,
  tests,
  onParameterUpdated,
}) {
  const navigate = useNavigate();
  const [testValues, setTestValues] = useState({});
  const [savingParams, setSavingParams] = useState({});
  const [runningTests, setRunningTests] = useState(false);

  const allParameters = parameters || [];
  const allTests = tests || [];
  const hasTests = allTests.length > 0;

  function handleReviewTests() {
    if (hasTests) {
      navigate(`/task/${task.id}/tests/preview`);
    }
  }

  async function handleRunTests() {
    setRunningTests(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}/run_tests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to run tests");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setRunningTests(false);
    }
  }

  function handleTestValuesChange(paramId, value) {
    setTestValues((prev) => ({
      ...prev,
      [paramId]: value,
    }));
  }

  async function handleSaveTestValues(param) {
    const values =
      testValues[param.id] ?? (param.example_values || []).join(", ");
    const exampleValuesArray = values
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    setSavingParams((prev) => ({ ...prev, [param.id]: true }));
    try {
      const response = await fetch(
        `/api/tasks/${task.id}/parameters/${param.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parameter: {
              example_values: exampleValuesArray,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save test values");
      }

      const updatedParam = await response.json();
      onParameterUpdated?.(updatedParam);
    } catch (error) {
      console.error(error);
    } finally {
      setSavingParams((prev) => ({ ...prev, [param.id]: false }));
    }
  }

  if (allParameters.length === 0) {
    return <div className="text-center py-12 text-gray-500"></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={handleRunTests}
          disabled={runningTests}
          className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {runningTests
            ? "Running Tests..."
            : hasTests
            ? "Re-Run Tests"
            : "Run Tests"}
        </button>
        {hasTests && (
          <button
            type="button"
            onClick={handleReviewTests}
            className="px-6 py-2.5 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-700 cursor-pointer"
          >
            Review Tests
          </button>
        )}
      </div>

      {allParameters.map((param) => {
        const currentValues =
          testValues[param.id] ?? (param.example_values || []).join(", ");
        const isSaving = savingParams[param.id];

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
                <button
                  type="button"
                  onClick={() => handleSaveTestValues(param)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
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
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
