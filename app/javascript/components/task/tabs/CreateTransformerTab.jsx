import React from "react";

export default function CreateTransformerTab({
  isGeneratingTransformCode,
  transformCode,
  generatingTransformMessage,
  onGenerateTransform,
  onNextStep,
  onBackStep,
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
            The AI is generating code to transform your data.
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
              Next Step
            </button>
          </div>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
            <code>{transformCode}</code>
          </pre>
        </div>
      ) : (
        <>
          <div className="pb-4 px-4">
            <p className="text-gray-600 mb-4 font-medium">
              Before generating the code, confirm the following:
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-medium">
                  1
                </span>
                <span className="text-gray-600">
                  The UI Preview looks correct
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-medium">
                  2
                </span>
                <span className="text-gray-600">
                  The mock data transformation looks correct
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-medium">
                  3
                </span>
                <span className="text-gray-600">
                  The image URLs are correct and visible in the UI Preview
                </span>
              </li>
            </ul>
          </div>
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onBackStep}
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back to UI Preview
            </button>
            <button
              type="button"
              onClick={onGenerateTransform}
              className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate Code
            </button>
          </div>
        </>
      )}
    </div>
  );
}
