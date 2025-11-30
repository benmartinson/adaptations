import React from "react";

export default function CreateTransformerTab({
  isGeneratingTransformCode,
  transformCode,
  generatingTransformMessage,
  onGenerateTransform,
  onNextStep,
}) {
  // Show loading state only when generating and no code exists yet
  if (isGeneratingTransformCode && !transformCode) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <div className="text-black text-lg font-bold mb-2">
            {generatingTransformMessage || "Generating code..."}
          </div>
          <p className="text-gray-500 text-sm">
            The AI is generating Ruby code to transform your data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {transformCode ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Review the generated transformation code below. If it doesn't look
            correct, you can regenerate it or go back to adjust the preview
            data.
          </p>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
            <code>{transformCode}</code>
          </pre>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onGenerateTransform}
              disabled={isGeneratingTransformCode}
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingTransformCode ? "Regenerating..." : "Regenerate"}
            </button>
            <button
              type="button"
              onClick={onNextStep}
              className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-700"
            >
              Next: Run Tests
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          Generating Code...
        </div>
      )}
    </div>
  );
}
