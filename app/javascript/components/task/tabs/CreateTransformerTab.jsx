import React, { useState, useEffect } from "react";
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
}) {
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
        <button
          type="button"
          onClick={handleGenerateTransform}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isGeneratingTransformCode}
        >
          {isGeneratingTransformCode
            ? "Generating"
            : transformCode
            ? "Re-generate Code"
            : "Generate Code"}
        </button>
      </div>

      {/* Content based on active tab or no transform code */}
      {(!transformCode || activeSubTab === "data-selector") && (
        <TransformationConfigurator
          fromResponse={fromResponse}
          toResponse={toResponse}
          taskId={taskId}
          onResponseUpdate={onResponseUpdate}
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
