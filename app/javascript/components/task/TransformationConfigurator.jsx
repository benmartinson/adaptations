import React from "react";
import StepCard from "./StepCard";

export default function TransformationConfigurator({
  currentStep,
  setCurrentStep,
  submitting,
  toResponseText,
  handleGenerate,
  isCancelable,
  handleStop,
  stopPending,
  fromResponse,
  toResponse,
  toResponseJsonError,
}) {
  function handlePreview() {
    localStorage.setItem("previewData", toResponseText);
    window.open("/preview", "_blank");
  }

  return (
    <StepCard
      stepNumber={2}
      title="Generate Transformed Data Format"
      currentStep={currentStep}
      isActive={currentStep === 2}
      onGoToStep={() => setCurrentStep(2)}
      generateLabel={submitting ? "Generating..." : "Generate"}
      showGenerateButton={true}
      nextLabel={"Next"}
      nextDisabled={submitting}
      onGenerate={handleGenerate}
      isSubmit
      footerContent={
        <div className="flex flex-wrap items-center gap-3">
          {isCancelable && (
            <button
              type="button"
              onClick={handleStop}
              className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-50"
              disabled={stopPending}
            >
              {stopPending ? "Stopping..." : "Stop task"}
            </button>
          )}
        </div>
      }
    >
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            From response (JSON)
          </label>
          <textarea
            className="w-full mt-1 rounded-lg border border-gray-300 p-3 font-mono text-sm h-96 focus:ring-2 focus:ring-blue-500"
            value={JSON.stringify(fromResponse, null, 2)}
            disabled
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">
              To response (JSON)
            </label>
            {toResponse && (
              <button
                type="button"
                onClick={handlePreview}
                className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-1 rounded hover:bg-blue-100 transition-colors font-medium"
              >
                Preview List
              </button>
            )}
          </div>
          {toResponseJsonError && (
            <div className="mt-1 mb-1 bg-red-50 border border-red-200 text-sm text-red-700 rounded-lg px-3 py-2">
              {toResponseJsonError}
            </div>
          )}
          <textarea
            className="w-full rounded-lg border border-gray-300 p-3 font-mono text-sm h-96 focus:ring-2 focus:ring-blue-500"
            value={toResponseText}
            disabled={!toResponse}
            // onChange={(event) =>
            //   // handleToResponseTextChange(event.target.value)
            // }
          />
        </div>
      </div>
    </StepCard>
  );
}
