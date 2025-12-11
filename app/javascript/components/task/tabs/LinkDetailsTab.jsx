import React from "react";

export default function LinkDetailsTab({
  fromSystemTag,
  setFromSystemTag,
  toSystemTag,
  setToSystemTag,
  formError,
  availableSystemTags = [],
  onContinue,
  isProcessing = false,
}) {
  const canContinue = fromSystemTag && toSystemTag && !isProcessing;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
      {formError && (
        <div className="bg-red-50 border border-red-200 text-sm text-red-700 rounded-xl px-4 py-3">
          {formError}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            From System Tag <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 bg-white"
            value={fromSystemTag}
            onChange={(event) => setFromSystemTag(event.target.value)}
          >
            <option value="">Select a system tag...</option>
            {availableSystemTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">
            The source system tag to link from.
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            To System Tag <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 bg-white"
            value={toSystemTag}
            onChange={(event) => setToSystemTag(event.target.value)}
          >
            <option value="">Select a system tag...</option>
            {availableSystemTags
              .filter((tag) => tag !== fromSystemTag)
              .map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
          </select>
          <p className="text-xs text-gray-500">
            The destination system tag to link to.
          </p>
        </div>

        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className="w-26 h-10 flex items-center justify-center rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? "Processing..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
