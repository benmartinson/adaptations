import React, { useState } from "react";

export default function EndpointDetailsTab({
  apiEndpoint,
  setApiEndpoint,
  systemTag,
  setSystemTag,
  dataDescription,
  setDataDescription,
  fetchingEndpoint,
  formError,
  onFetchEndpoint,
  isGeneratingPreview,
  generatingMessage,
  taskId,
  parameters,
  onParametersChange,
}) {
  const [newParamName, setNewParamName] = useState("");
  const [newParamExampleValue, setNewParamExampleValue] = useState("");
  const [savingParam, setSavingParam] = useState(false);
  const [paramErrors, setParamErrors] = useState({});

  async function handleAddParameter() {
    if (!newParamName.trim() || !newParamExampleValue.trim()) return;

    // Validate example value is in endpoint
    if (!apiEndpoint.includes(newParamExampleValue.trim())) {
      setParamErrors((prev) => ({
        ...prev,
        new: "Example value must be included in the API endpoint",
      }));
      return;
    }

    setSavingParam(true);
    setParamErrors((prev) => ({ ...prev, new: null }));
    try {
      const response = await fetch(`/api/tasks/${taskId}/parameters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parameter: {
            name: newParamName.trim(),
            example_value: newParamExampleValue.trim(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create parameter");
      }

      const newParam = await response.json();
      onParametersChange([...parameters, newParam]);
      setNewParamName("");
      setNewParamExampleValue("");
    } catch (error) {
      console.error("Error adding parameter:", error);
    } finally {
      setSavingParam(false);
    }
  }

  async function handleDeleteParameter(paramId) {
    try {
      const response = await fetch(
        `/api/tasks/${taskId}/parameters/${paramId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete parameter");
      }

      onParametersChange(parameters.filter((p) => p.id !== paramId));
      setParamErrors((prev) => {
        const next = { ...prev };
        delete next[paramId];
        return next;
      });
    } catch (error) {
      console.error("Error deleting parameter:", error);
    }
  }

  async function handleUpdateParameter(paramId, field, value) {
    const param = parameters.find((p) => p.id === paramId);
    if (!param) return;

    const updatedData = {
      name: field === "name" ? value : param.name,
      example_value: field === "example_value" ? value : param.example_value,
    };

    // Clear previous error for this param
    setParamErrors((prev) => ({ ...prev, [paramId]: null }));

    // Validate example value is in endpoint when updating example_value
    if (field === "example_value" && value.trim()) {
      if (!apiEndpoint.includes(value.trim())) {
        setParamErrors((prev) => ({
          ...prev,
          [paramId]: "Example value must be included in the API endpoint",
        }));
        return;
      }
    }

    try {
      const response = await fetch(
        `/api/tasks/${taskId}/parameters/${paramId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parameter: updatedData }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setParamErrors((prev) => ({
          ...prev,
          [paramId]: errorData.error || "Failed to update parameter",
        }));
        return;
      }

      const updatedParam = await response.json();
      onParametersChange(
        parameters.map((p) => (p.id === paramId ? updatedParam : p))
      );
    } catch (error) {
      console.error("Error updating parameter:", error);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">API Endpoint</h2>

      {formError && (
        <div className="bg-red-50 border border-red-200 text-sm text-red-700 rounded-xl px-4 py-3">
          {formError}
        </div>
      )}

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Enter API Endpoint
        </label>
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            type="url"
            className="flex-1 rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/api/endpoint"
            value={apiEndpoint}
            onChange={(event) => setApiEndpoint(event.target.value)}
            disabled={fetchingEndpoint}
          />
          <button
            type="button"
            onClick={onFetchEndpoint}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800 disabled:opacity-50"
            disabled={!apiEndpoint || !systemTag || fetchingEndpoint}
          >
            {fetchingEndpoint ? "Fetching..." : "Generate Preview"}
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
            disabled={fetchingEndpoint}
          />
          <p className="text-xs text-gray-500">
            Required: Request identifier tag that describes the request (e.g.,
            "BooksByAuthor"). Must be one word with no spaces.
          </p>
        </div>

        {/* Path Parameters Section */}
        <div className="space-y-3 pt-2">
          <label className="block text-sm font-medium text-gray-700">
            Path Parameters
          </label>
          <p className="text-xs text-gray-500">
            Define path parameters that can be used in the API endpoint. The
            example value must match a value in the endpoint URL above.
          </p>

          {/* Existing Parameters */}
          {parameters.length > 0 && (
            <div className="space-y-2">
              {parameters.map((param) => (
                <div key={param.id} className="space-y-1">
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      className="flex-1 rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="Identifier (e.g., author_id)"
                      value={param.name}
                      onChange={(e) => {
                        // Update local state immediately for responsiveness
                        onParametersChange(
                          parameters.map((p) =>
                            p.id === param.id
                              ? { ...p, name: e.target.value }
                              : p
                          )
                        );
                      }}
                      onBlur={(e) =>
                        handleUpdateParameter(param.id, "name", e.target.value)
                      }
                    />
                    <input
                      type="text"
                      className={`flex-1 rounded-lg border p-2 text-sm focus:ring-2 focus:ring-blue-500 ${
                        paramErrors[param.id]
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="Example value (from endpoint)"
                      value={param.example_value || ""}
                      onChange={(e) => {
                        // Update local state immediately for responsiveness
                        onParametersChange(
                          parameters.map((p) =>
                            p.id === param.id
                              ? { ...p, example_value: e.target.value }
                              : p
                          )
                        );
                      }}
                      onBlur={(e) =>
                        handleUpdateParameter(
                          param.id,
                          "example_value",
                          e.target.value
                        )
                      }
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteParameter(param.id)}
                      className="p-2 text-gray-400 hover:text-red-600 focus:outline-none"
                      aria-label={`Remove ${param.name}`}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  {paramErrors[param.id] && (
                    <p className="text-xs text-red-600 ml-1">
                      {paramErrors[param.id]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add New Parameter */}
          <div className="space-y-1">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                className="flex-1 rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="Identifier (e.g., author_id)"
                value={newParamName}
                onChange={(e) => setNewParamName(e.target.value)}
                disabled={savingParam}
              />
              <input
                type="text"
                className={`flex-1 rounded-lg border p-2 text-sm focus:ring-2 focus:ring-blue-500 ${
                  paramErrors.new
                    ? "border-red-500 bg-red-50"
                    : "border-gray-300"
                }`}
                placeholder="Example value (from endpoint)"
                value={newParamExampleValue}
                onChange={(e) => {
                  setNewParamExampleValue(e.target.value);
                  if (paramErrors.new) {
                    setParamErrors((prev) => ({ ...prev, new: null }));
                  }
                }}
                onBlur={() => {
                  if (newParamName.trim() && newParamExampleValue.trim()) {
                    handleAddParameter();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddParameter();
                  }
                }}
                disabled={savingParam}
              />
              <div className="w-9" />{" "}
              {/* Spacer to align with delete buttons */}
            </div>
            {paramErrors.new && (
              <p className="text-xs text-red-600 ml-1">{paramErrors.new}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Data Description (Optional)
          </label>
          <textarea
            className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 resize-y"
            placeholder="Describe the data returned by this endpoint to help the chatbot understand and transform it better..."
            value={dataDescription}
            onChange={(event) => setDataDescription(event.target.value)}
            rows={3}
          />
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
