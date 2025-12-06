import React, { useState, useEffect } from "react";

export default function EndpointDetailsTab({
  apiEndpoint: initialApiEndpoint,
  setApiEndpoint: syncApiEndpoint,
  systemTag: initialSystemTag,
  setSystemTag: syncSystemTag,
  dataDescription: initialDataDescription,
  setDataDescription: syncDataDescription,
  fetchingEndpoint,
  formError,
  onFetchEndpoint,
  onCreateParameters,
  isGeneratingPreview,
  generatingMessage,
  taskId,
  parameters: initialParameters,
  onParametersChange: syncParameters,
}) {
  // Local state controlled internally
  const [apiEndpoint, setApiEndpoint] = useState(initialApiEndpoint || "");
  const [systemTag, setSystemTag] = useState(initialSystemTag || "");
  const [dataDescription, setDataDescription] = useState(
    initialDataDescription || ""
  );
  const [parameters, setParameters] = useState(initialParameters || []);

  const [endpointError, setEndpointError] = useState(null);

  // Sync local state when initial values change from parent
  useEffect(() => {
    if (initialApiEndpoint && initialApiEndpoint !== apiEndpoint) {
      setApiEndpoint(initialApiEndpoint);
    }
  }, [initialApiEndpoint]);

  useEffect(() => {
    if (initialSystemTag && initialSystemTag !== systemTag) {
      setSystemTag(initialSystemTag);
    }
  }, [initialSystemTag]);

  useEffect(() => {
    if (initialDataDescription && initialDataDescription !== dataDescription) {
      setDataDescription(initialDataDescription);
    }
  }, [initialDataDescription]);

  useEffect(() => {
    if (initialParameters && initialParameters.length > 0) {
      setParameters(initialParameters);
    }
  }, [initialParameters]);

  // Sync local changes back to parent
  const handleApiEndpointChange = (value) => {
    setApiEndpoint(value);
    syncApiEndpoint(value);
    setEndpointError(null);
  };

  const handleSystemTagChange = (value) => {
    setSystemTag(value);
    syncSystemTag(value);
  };

  const handleDataDescriptionChange = (value) => {
    setDataDescription(value);
    syncDataDescription(value);
  };

  const updateParameters = (newParams) => {
    setParameters(newParams);
    syncParameters(newParams);
  };

  // Extract path params from URL (e.g., {author_id} -> author_id)
  const extractPathParams = (url) => {
    const matches = url.match(/\{([^}]+)\}/g);
    if (!matches) return [];
    return matches.map((m) => m.slice(1, -1)); // Remove { and }
  };

  // Check if URL has path params in brackets
  const hasPathParams = (url) => {
    return /\{[^}]+\}/.test(url);
  };

  // On blur, extract params from URL and show them locally (no API call yet)
  const handleEndpointBlur = () => {
    if (!apiEndpoint) return;

    const pathParams = extractPathParams(apiEndpoint);
    if (pathParams.length === 0) return;

    const existingNames = parameters.map((p) => p.name);
    const newParams = pathParams.filter(
      (name) => !existingNames.includes(name)
    );

    if (newParams.length === 0) return;

    const localParams = newParams.map((name, index) => ({
      id: `temp-${name}-${Date.now()}-${index}`,
      name,
      example_value: "",
      isLocal: true, // Flag to indicate not yet saved to backend
    }));

    setParameters([...parameters, ...localParams]);
  };

  // Validate endpoint has path params and all params have example values
  const validateForSubmit = () => {
    if (!hasPathParams(apiEndpoint)) {
      setEndpointError(
        'Path Params are required, in brackets. For example "https://openlibrary.org/authors/{author_id}.json"'
      );
      return false;
    }

    // Check all path params have example values
    const pathParams = extractPathParams(apiEndpoint);
    const missingValues = pathParams.filter((name) => {
      const param = parameters.find((p) => p.name === name);
      return !param || !param.example_value?.trim();
    });

    if (missingValues.length > 0) {
      setEndpointError(
        `Please provide example values for: ${missingValues.join(", ")}`
      );
      return false;
    }

    setEndpointError(null);
    return true;
  };

  const handleFetchWithValidation = async () => {
    if (!validateForSubmit()) return;

    // Get local params that need to be created in backend
    const localParams = parameters.filter((p) => p.isLocal);

    if (localParams.length > 0 && onCreateParameters) {
      // Create params in backend and get the real params back
      const createdParams = await onCreateParameters(localParams);
      if (createdParams) {
        // Replace local params with backend-created ones
        const nonLocalParams = parameters.filter((p) => !p.isLocal);
        const updatedParams = [...nonLocalParams, ...createdParams];
        setParameters(updatedParams);
        syncParameters(updatedParams);
      }
    }

    onFetchEndpoint(apiEndpoint, systemTag, dataDescription, parameters);
  };

  function handleUpdateParameter(paramId, field, value) {
    // Just update local state - backend save happens on Generate Preview
    updateParameters(
      parameters.map((p) => (p.id === paramId ? { ...p, [field]: value } : p))
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">API Endpoint</h2>

      {(formError || endpointError) && (
        <div className="bg-red-50 border border-red-200 text-sm text-red-700 rounded-xl px-4 py-3">
          {formError || endpointError}
        </div>
      )}

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Enter API Endpoint (with path params in brackets)
        </label>
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            type="url"
            className="flex-1 rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500"
            placeholder="https://openlibrary.org/authors/{author_id}.json"
            value={apiEndpoint}
            onChange={(e) => handleApiEndpointChange(e.target.value)}
            onBlur={handleEndpointBlur}
            disabled={fetchingEndpoint}
          />
          <button
            type="button"
            onClick={handleFetchWithValidation}
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
            onChange={(e) => handleSystemTagChange(e.target.value)}
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
            {parameters.length > 0
              ? "These parameters were detected from your URL. Provide an example value for each to test the endpoint."
              : "Add path parameters to your URL using brackets, e.g. {author_id}"}
          </p>

          {parameters.length > 0 && (
            <div className="space-y-2">
              {parameters.map((param) => (
                <div key={param.id} className="space-y-1">
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      className="flex-1 rounded-lg border border-gray-200 bg-gray-50 p-2 text-sm text-gray-600 font-mono"
                      value={param.name}
                      readOnly
                    />
                    <input
                      type="text"
                      className={`flex-1 rounded-lg border p-2 text-sm focus:ring-2 focus:ring-blue-500 ${
                        !param.example_value?.trim()
                          ? "border-orange-300 bg-orange-50"
                          : "border-gray-300"
                      }`}
                      placeholder="Example value (required)"
                      value={param.example_value || ""}
                      onChange={(e) => {
                        updateParameters(
                          parameters.map((p) =>
                            p.id === param.id
                              ? { ...p, example_value: e.target.value }
                              : p
                          )
                        );
                        setEndpointError(null);
                      }}
                      onBlur={(e) =>
                        handleUpdateParameter(
                          param.id,
                          "example_value",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Data Description (Optional)
          </label>
          <textarea
            className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 resize-y"
            placeholder="Describe the data returned by this endpoint to help the chatbot understand and transform it better..."
            value={dataDescription}
            onChange={(e) => handleDataDescriptionChange(e.target.value)}
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
