import React, { useEffect, useState } from "react";

export default function ListLinkTransformerTab({
  isGenerating,
  onGenerateTransform,
  transformCode,
  errorMessage,
}) {
  const [cyclingMessage, setCyclingMessage] = useState(
    "Generating Transformation Code..."
  );

  // Handle cycling message during transform code generation
  useEffect(() => {
    let interval;
    if (isGenerating) {
      interval = setInterval(() => {
        setCyclingMessage((prev) =>
          prev === "Generating Transformation Code..."
            ? "Background process, may take several seconds"
            : "Generating Transformation Code..."
        );
      }, 3000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isGenerating]);

  // Show loading state when generating
  if (isGenerating) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <div className="text-black text-lg font-bold mb-2">
            {cyclingMessage}
          </div>
          <p className="text-gray-500 text-sm">
            Generating code to transform list items into API endpoints...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{errorMessage}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header with generate button */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={onGenerateTransform}
          disabled={isGenerating}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating
            ? "Generating..."
            : transformCode
            ? "Re-generate Code"
            : "Generate Code"}
        </button>
      </div>

      {/* Transform code display */}
      {transformCode ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap">
            {transformCode}
          </pre>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12 text-gray-500">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
            <p className="text-sm">
              No transform code generated yet. Click "Generate Code" to create
              the transformation logic.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
