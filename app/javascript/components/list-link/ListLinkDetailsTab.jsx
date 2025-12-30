import React, { useEffect } from "react";

export default function ListLinkDetailsTab({
  fromSystemTag,
  toSystemTag,
  setToSystemTag,
  fromResponse,
  toEndpoint,
  formError,
  availableSystemTags = [],
  exampleMappings,
  setExampleMappings,
  onContinue,
  isProcessing = false,
}) {
  // Populate empty endpoint fields with toEndpoint when it becomes available
  useEffect(() => {
    if (toEndpoint && exampleMappings.length > 0) {
      const hasEmptyEndpoints = exampleMappings.some((m) => !m.endpoint);
      if (hasEmptyEndpoints) {
        setExampleMappings(
          exampleMappings.map((m) => ({
            ...m,
            endpoint: m.endpoint || toEndpoint,
          }))
        );
      }
    }
  }, [toEndpoint, exampleMappings.length]);

  const canContinue =
    fromSystemTag &&
    toSystemTag &&
    !isProcessing &&
    exampleMappings.filter((m) => m.endpoint.trim()).length >= 2;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
      {formError && (
        <div className="bg-red-50 border border-red-200 text-sm text-red-700 rounded-xl px-4 py-3">
          {formError}
        </div>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              From System Tag <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-500"
              value={fromSystemTag}
              disabled={true}
            >
              <option value="">Select a system tag...</option>
              {availableSystemTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              The source system tag (set by parent task).
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
        </div>

        {toSystemTag && toEndpoint && (
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div>
              <h4 className="font-medium text-gray-900">
                Example Endpoint Mappings
              </h4>
              <p className="text-sm text-gray-600">
                For each sample list item below, provide the API endpoint URL
                that would be used to fetch its detailed data. We'll use these
                examples to generate the transformation code.
              </p>
            </div>

            {exampleMappings.length === 0 ? (
              <div className="text-sm text-gray-500 italic">
                No sample items available. Make sure the parent task has
                response data.
              </div>
            ) : (
              <div className="space-y-4">
                {exampleMappings.map((mapping, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-3 space-y-2"
                  >
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Sample Item {index + 1}
                      </label>
                      <pre className="mt-1 text-xs bg-white border border-gray-200 rounded p-2 overflow-x-auto max-h-32">
                        {JSON.stringify(mapping.item, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Target Endpoint URL
                      </label>
                      <input
                        type="url"
                        value={mapping.endpoint}
                        onChange={(e) => {
                          const newMappings = [...exampleMappings];
                          newMappings[index].endpoint = e.target.value;
                          setExampleMappings(newMappings);
                        }}
                        placeholder={toEndpoint}
                        className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500">
              Provide at least 2 example mappings to generate the
              transformation.
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onContinue(exampleMappings)}
            disabled={!canContinue}
            className="px-6 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? "Processing..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
