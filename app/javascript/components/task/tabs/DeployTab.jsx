import React from "react";

export default function DeployTab({ task, fromTask, isLinkTask = false }) {
  const systemTag = task?.system_tag || "your_system_tag";
  const toSystemTag = task?.to_system_tag || "your_target_system_tag";
  const exampleEndpoint =
    fromTask?.api_endpoint || "https://api.example.com/data";

  const className = isLinkTask ? "LinkTransformProcess" : "TransformProcess";
  const systemTagParam = isLinkTask ? "from_system_tag" : "system_tag";

  const basicExample = `# Basic usage
result = ${className}.new(
  ${systemTagParam}: "${systemTag}"${
    isLinkTask ? `,\n  to_system_tag: "${toSystemTag}"` : ""
  },
  api_endpoint: "${exampleEndpoint}"
).call`;

  const withLoggingExample = `# With automated test logging
result = ${className}.new(
  ${systemTagParam}: "${systemTag}"${
    isLinkTask ? `,\n  to_system_tag: "${toSystemTag}"` : ""
  },
  api_endpoint: "${exampleEndpoint}",
  log_tests: true
).call`;

  const errorHandlingExample = `# With error handling
begin
  result = ${className}.new(
    ${systemTagParam}: "${systemTag}"${
    isLinkTask ? `,\n    to_system_tag: "${toSystemTag}"` : ""
  },
    api_endpoint: "${exampleEndpoint}",
    log_tests: true
  ).call
rescue ${className}::NotFoundError => e
  # Task not found or has no transform code
  Rails.logger.error("Transform not found: #{e.message}")
rescue ${className}::TransformError => e
  # API fetch failed or transform execution failed
  Rails.logger.error("Transform failed: #{e.message}")
end`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Using {isLinkTask ? "LinkTransformProcess" : "TransformProcess"}
        </h2>
        <p className="text-gray-600 text-sm">
          Use the{" "}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">
            {className}
          </code>{" "}
          class to fetch data from an API endpoint and run your transformation
          code.
        </p>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Parameters</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">
              {systemTagParam}
            </code>
            <span className="text-red-500 ml-1">*</span>
            <span className="ml-2">
              — The unique identifier for {isLinkTask ? "the source" : "your"}{" "}
              task.
            </span>
          </li>
          {isLinkTask && (
            <li>
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">
                to_system_tag
              </code>
              <span className="text-red-500 ml-1">*</span>
              <span className="ml-2">
                — The unique identifier for the target task.
              </span>
            </li>
          )}
          <li>
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">
              api_endpoint
            </code>
            <span className="text-red-500 ml-1">*</span>
            <span className="ml-2">
              — The endpoint to fetch initial data from. Path parameter values
              can differ from the example.
            </span>
          </li>
          <li>
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">
              log_tests
            </code>
            <span className="ml-2">
              — Log results as automated tests (default: false)
            </span>
          </li>
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Basic Usage</h3>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
          {basicExample}
        </pre>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          With Automated Test Logging
        </h3>
        <p className="text-gray-500 text-sm mb-2">
          Set{" "}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">
            log_tests: true
          </code>{" "}
          to automatically create test records for each unique endpoint. These
          will appear in the Automated Tests tab.
        </p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
          {withLoggingExample}
        </pre>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Error Handling
        </h3>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
          {errorHandlingExample}
        </pre>
      </div>
    </div>
  );
}
