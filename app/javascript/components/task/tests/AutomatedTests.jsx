import React, { useState } from "react";
import TestCard from "./TestCard";

export default function AutomatedTests({
  tests,
  task,
  fetchedDataMap,
  fetchingEndpoints,
  runningTestIds,
  onRunTest,
  onTestUpdate,
}) {
  const automatedTests = tests
    .filter((t) => t.test_type === "automated")
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  if (automatedTests.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-gray-600 text-sm">
          When using the gem inside your own app (see deploy tab), tests will
          show up here for each unique endpoint variation hit.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {automatedTests.map((test) => (
        <TestCard
          key={test.id}
          test={test}
          testResult={test}
          endpoint={test.api_endpoint}
          expectedOutput={test.expected_output}
          fetchedData={fetchedDataMap[test.api_endpoint]}
          isFetching={fetchingEndpoints[test.api_endpoint]}
          isRunning={runningTestIds.includes(test.id)}
          onRun={() => onRunTest(test.id)}
          onTestUpdate={onTestUpdate}
          isPrimary={false}
          taskId={task.id}
        />
      ))}
    </div>
  );
}
