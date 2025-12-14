import React, { useEffect, useState } from "react";
import TransformationConfigurator from "../TransformationConfigurator";
import useTaskProgress from "../../../hooks/useTaskProgress";

export default function CreateTransformerTab({
  isGeneratingTransformCode,
  generatingTransformMessage,
  onGenerateTransform,
  transformCode,
  fromResponse,
  toResponse,
  taskId,
  onResponseUpdate,
  isLinkTask = false,
  onGenerateTests,
  isGeneratingTests,
}) {
  const { snapshot } = useTaskProgress(taskId);

  function handleGenerateTransform() {
    onGenerateTransform();
  }
  const [activeSubTab, setActiveSubTab] = useState(
    transformCode ? "transform-code" : "data-selector"
  );

  const subTabs = [
    { id: "data-selector", label: "Data Selector" },
    { id: "transform-code", label: "Transform Code" },
  ];

  // useEffect(() => {
  //   if (transformCode) {
  //     if (isGeneratingPreview) {
  //       setIsGeneratingPreview(false);
  //     }
  //     setActiveSubTab("transform-code");
  //   }
  // }, [transformCode]);

  useEffect(() => {
    if (snapshot?.error_message && isGeneratingTests) {
      setIsGeneratingTests(false);
    }
  }, [snapshot?.error_message]);

  // Show loading state when generating
  if (isGeneratingTransformCode) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <div className="text-black text-lg font-bold mb-2">
            {generatingTransformMessage || "Generating code..."}
          </div>
          <p className="text-gray-500 text-sm">
            Generating code to transform your data..
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {snapshot?.error_message && (
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
                <p>{snapshot.error_message}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header with tabs and generate button */}
      <div className="flex items-center justify-between">
        {transformCode ? (
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {subTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeSubTab === tab.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : (
          <div />
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleGenerateTransform}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-900 font-semibold hover:bg-gray-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isGeneratingTransformCode}
          >
            {isGeneratingTransformCode
              ? "Generating"
              : transformCode
              ? "Re-generate Code"
              : "Generate Code"}
          </button>
          {isLinkTask && transformCode && (
            <button
              type="button"
              onClick={onGenerateTests}
              className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isGeneratingTransformCode || isGeneratingTests}
            >
              {isGeneratingTests ? "Generating Tests" : "Generate Tests"}
            </button>
          )}
        </div>
      </div>

      {/* Content based on active tab or no transform code */}
      {(!transformCode || activeSubTab === "data-selector") && (
        <TransformationConfigurator
          fromResponse={fromResponse}
          toResponse={toResponse}
          taskId={taskId}
          onResponseUpdate={onResponseUpdate}
          isLinkTask={isLinkTask}
        />
      )}

      {transformCode && activeSubTab === "transform-code" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap">
            {transformCode}
          </pre>
        </div>
      )}
    </div>
  );
}
