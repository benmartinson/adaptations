import React from "react";
import PreviewList from "./PreviewList";

export default function UIPreviewTab({
  responseJson,
  isGeneratingTransformCode,
  onNextStep,
  generatingTransformMessage,
}) {
  return (
    <div className="space-y-4">
      {responseJson && (
        <>
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-4">
              {isGeneratingTransformCode && (
                <span className="text-black text-sm font-bold">
                  {generatingTransformMessage}
                </span>
              )}
              <button
                type="button"
                onClick={onNextStep}
                className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Next Step
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <PreviewList
              toResponseText={JSON.stringify(responseJson, null, 2)}
            />
          </div>
        </>
      )}

      {!responseJson && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No preview available yet.</p>
          </div>
        </div>
      )}
    </div>
  );
}
