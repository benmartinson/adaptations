import React from "react";
export default function StepCard({
  stepNumber,
  title,
  isActive,
  currentStep,
  children,
  onNext = () => {},
  nextLabel = "Next",
  nextDisabled = false,
  isSubmit = false,
  footerContent = null,
  onGoToStep = () => {},
}) {
  const header = (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Step {stepNumber}
        </p>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      {!isActive && currentStep > stepNumber && (
        <button
          type="button"
          onClick={onGoToStep}
          className="text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          Go back to this step
        </button>
      )}
    </div>
  );

  if (!isActive) {
    return (
      <section className="bg-white shadow rounded-2xl p-6">{header}</section>
    );
  }

  const nextButton = (
    <button
      type={isSubmit ? "submit" : "button"}
      onClick={isSubmit ? undefined : onNext}
      className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
      disabled={nextDisabled}
    >
      {nextLabel}
    </button>
  );

  return (
    <section className="bg-white shadow rounded-2xl p-6 space-y-4">
      {header}
      <div>{children}</div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {footerContent && (
          <div className="flex flex-1 flex-wrap items-center gap-3">
            {footerContent}
          </div>
        )}
        <div className="flex w-full justify-end sm:w-auto">{nextButton}</div>
      </div>
    </section>
  );
}
