import React from "react";
import PreviewList from "../PreviewList";

export default function UIPreviewTab({
  responseJson,
  isGeneratingTransformCode,
  onGenerateTransform,
  generatingTransformMessage,
  onOpenAdvancedOptions,
}) {
  return (
    <>
      {responseJson && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Here is a preview of what the response data layout will look like
            after it's been transformed. If it's not correct, you can go back to
            the 'Endpoint Details' section and modify the 'Data Description' to
            provide the model with more details about what data transformation
            is required. If you need more control you can click{" "}
            <button
              onClick={onOpenAdvancedOptions}
              className="text-blue-600 hover:text-blue-800 font-medium underline"
            >
              here
            </button>{" "}
            to open advanced options.
          </p>
          <button
            type="button"
            onClick={onGenerateTransform}
            disabled={isGeneratingTransformCode}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isGeneratingTransformCode ? "Generating..." : "Generate Transform"}
          </button>
          {isGeneratingTransformCode && (
            <div className="text-black text-md font-bold">
              {generatingTransformMessage}
            </div>
          )}
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {responseJson ? (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Preview
            </h2>
            <PreviewList toResponseText={JSON.stringify(responseJson, null, 2)} />
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No preview available yet.</p>
            <p className="text-sm mt-2">
              Please fetch an endpoint first from the Endpoint Details tab.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

