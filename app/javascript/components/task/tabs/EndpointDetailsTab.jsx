import React from "react";
import { ELEMENT_TYPES } from "../../../helpers";

export default function EndpointDetailsTab({
  taskId,
  apiEndpoint,
  setApiEndpoint,
  systemTag,
  setSystemTag,
  dataDescription,
  setDataDescription,
  elementType,
  setElementType,
  formError,
  onFetchEndpoint,
  isGeneratingPreview,
  generatingMessage,
  transformCode,
}) {
  function handleFetchEndpoint() {
    onFetchEndpoint(dataDescription, null, elementType);
  }
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
      {formError && (
        <div className="bg-red-50 border border-red-200 text-sm text-red-700 rounded-xl px-4 py-3">
          {formError}
        </div>
      )}

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          API Endpoint Example
        </label>
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            type="url"
            className="flex-1 rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/api/endpoint"
            value={apiEndpoint}
            onChange={(event) => setApiEndpoint(event.target.value)}
            disabled={isGeneratingPreview}
          />
          <button
            type="button"
            onClick={handleFetchEndpoint}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800 disabled:opacity-50"
            disabled={isGeneratingPreview}
          >
            {isGeneratingPreview ? "Generating Preview..." : "Generate Preview"}
          </button>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            System Tag <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500"
            value={systemTag}
            onChange={(event) => setSystemTag(event.target.value)}
            disabled={isGeneratingPreview}
          />
          <p className="text-xs text-gray-500">
            Required: Request identifier tag that describes the request (e.g.,
            "BooksByAuthor"). Must be one word with no spaces.
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Data Description (Optional)
          </label>
          <textarea
            className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 resize-y"
            placeholder="Describe the data returned by this endpoint. Any specific fields, relationships, or patterns you want to highlight..."
            value={dataDescription}
            onChange={(event) => setDataDescription(event.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Type of Element
          </label>
          <select
            className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500"
            value={elementType}
            onChange={(e) => setElementType(e.target.value)}
            disabled={isGeneratingPreview}
          >
            {Object.entries(ELEMENT_TYPES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {isGeneratingPreview && (
          <div className="text-black text-md font-bold">
            {generatingMessage || "Generating Preview..."}
          </div>
        )}
      </div>
    </div>
  );
}
