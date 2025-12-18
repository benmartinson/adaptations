import React, { useState, useEffect } from "react";
import PreviewList from "./PreviewList";
import DynamicUIFile from "./DynamicUIFile";
import useTaskProgress from "../../../hooks/useTaskProgress";

export default function UIPreviewTab({
  isGeneratingPreview,
  onNextStep,
  taskId,
}) {
  const { responseJson } = useTaskProgress(taskId);
  const [uiFiles, setUiFiles] = useState([]);
  const [uiFilesError, setUiFilesError] = useState(null);
  const [cyclingMessage, setCyclingMessage] = useState(
    "Generating UI Preview..."
  );

  // Handle cycling message during transform code generation
  useEffect(() => {
    let interval;
    if (isGeneratingPreview) {
      interval = setInterval(() => {
        setCyclingMessage((prev) =>
          prev === "Generating UI Preview..."
            ? "Background process, may take several seconds"
            : "Generating UI Preview..."
        );
      }, 3000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isGeneratingPreview]);

  useEffect(() => {
    if (!taskId) return;

    let cancelled = false;

    async function loadUiFiles() {
      try {
        setUiFilesError(null);
        const res = await fetch(`/api/tasks/${taskId}/ui_files`);
        if (!res.ok) throw new Error(`UI files endpoint failed: ${res.status}`);
        const data = await res.json();

        if (!cancelled) setUiFiles(data);
      } catch (e) {
        if (!cancelled)
          setUiFilesError(e?.message || "Failed to load UI files");
      }
    }

    loadUiFiles();
    return () => {
      cancelled = true;
    };
  }, [taskId, responseJson]);

  return (
    <div className="space-y-4">
      {responseJson && (
        <>
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-4">
              {isGeneratingPreview && (
                <span className="text-black text-sm font-bold">
                  {cyclingMessage}
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

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full">
            {uiFiles.length > 0 ? (
              uiFiles.map((uiFile) => (
                <DynamicUIFile
                  key={uiFile.id}
                  file={uiFile}
                  responseJson={responseJson}
                />
              ))
            ) : (
              <PreviewList
                toResponseText={JSON.stringify(responseJson, null, 2)}
              />
            )}
          </div>

          {uiFilesError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{uiFilesError}</p>
            </div>
          )}
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
