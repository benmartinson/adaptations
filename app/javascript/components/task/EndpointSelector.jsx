import React from "react";
import StepCard from "./StepCard";

export default function EndpointSelector({
  apiEndpoint,
  setApiEndpoint,
  handleFetchEndpoint,
  fetchingEndpoint,
  fromResponse,
  currentStep,
  setCurrentStep,
}) {
  return (
    <StepCard
      stepNumber={1}
      title="Choose the API Endpoint"
      currentStep={currentStep}
      isActive={currentStep === 1}
      onNext={() => setCurrentStep(2)}
      onGoToStep={() => setCurrentStep(1)}
      nextDisabled={!apiEndpoint || !fromResponse}
    >
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Api Endpoint
        </label>
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            type="url"
            className="flex-1 rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/api/endpoint"
            value={apiEndpoint}
            onChange={(event) => setApiEndpoint(event.target.value)}
          />
          <button
            type="button"
            onClick={handleFetchEndpoint}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800 disabled:opacity-50"
            disabled={!apiEndpoint || fetchingEndpoint}
          >
            {fetchingEndpoint ? "Fetching..." : "Get Response"}
          </button>
        </div>
      </div>
    </StepCard>
  );
}

