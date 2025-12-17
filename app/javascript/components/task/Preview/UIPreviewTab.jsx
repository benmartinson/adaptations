import React, { useState, useEffect } from "react";
import PreviewList from "./PreviewList";

function DynamicUIFile({ file, responseJson }) {
  const [Component, setComponent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadComponent() {
      try {
        setError(null);
        const mod = await import(file.file_name);
        if (!mod?.default)
          throw new Error("Remote module had no default export");

        if (!cancelled) setComponent(() => mod.default);
      } catch (e) {
        console.error(e);
        if (!cancelled)
          setError(e?.message || `Failed to load ${file.file_name}`);
      }
    }

    loadComponent();
    return () => {
      cancelled = true;
    };
  }, [file.file_name]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!Component || !responseJson) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading UI component...</p>
      </div>
    );
  }
  return <Component data={responseJson} />;
}

export default function UIPreviewTab({
  responseJson,
  isGeneratingTransformCode,
  onNextStep,
  generatingTransformMessage,
  taskId,
}) {
  const [uiFiles, setUiFiles] = useState([]);
  const [uiFilesError, setUiFilesError] = useState(null);

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
  }, [taskId]);
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
