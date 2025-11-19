import React from "react";

export default function TaskStatus({
  activeTask,
  latestCode,
  testResults,
  progressError,
}) {
  return (
    <section className="bg-white shadow rounded-2xl p-6 space-y-4">
      {!activeTask && (
        <p className="text-sm text-gray-500">
          Launch a workflow or pick one from the list below to see details.
        </p>
      )}
      {activeTask && (
        <>
          <div>
            <h3 className="text-lg font-semibold mb-2">Latest code</h3>
            <pre className="bg-gray-900 text-green-200 rounded-xl p-4 overflow-x-auto text-sm">
              {latestCode || "# awaiting generation"}
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Tests</h3>
            {testResults.length === 0 && (
              <p className="text-sm text-gray-500">
                No test results yet. Add test cases to your payload to see
                pass/fail updates.
              </p>
            )}
            <ul className="space-y-2">
              {testResults.map((result) => (
                <li
                  key={result.name}
                  className="border border-gray-200 rounded-xl p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{result.name}</span>
                  </div>
                  {result.error && (
                    <p className="text-sm text-red-600 mt-1">{result.error}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
      {progressError && (
        <p className="text-sm text-red-600">
          Live updates unavailable: {progressError.message}
        </p>
      )}
    </section>
  );
}

