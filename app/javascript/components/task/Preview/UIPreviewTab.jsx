import React, { useEffect, useState } from "react";
import PreviewList from "./PreviewList";
import TransformationConfigurator from "../TransformationConfigurator";
import { fetchEndpointData } from "../../../helpers";

export default function UIPreviewTab({
  responseJson,
  isGeneratingTransformCode,
  onNextStep,
  generatingTransformMessage,
  fromResponse,
  taskId,
  onResponseUpdate,
  apiEndpoint,
}) {
  const [activeSubTab, setActiveSubTab] = useState("preview");
  const [fromResponseData, setFromResponseData] = useState(fromResponse);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  const subTabs = [
    { id: "preview", label: "Preview" },
    { id: "data-selection", label: "Data Selection" },
  ];

  useEffect(() => {
    if (!fromResponse && apiEndpoint && !hasAttemptedFetch) {
      setHasAttemptedFetch(true);
      handleFetchEndpoint();
    }
  }, [fromResponse, apiEndpoint]);

  async function handleFetchEndpoint() {
    const fetchedData = await fetchEndpointData(apiEndpoint);
    setFromResponseData(fetchedData);
    console.log("fetchedData", fetchedData);
  }

  return (
    <div className="space-y-4">
      {responseJson && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              {subTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeSubTab === tab.id
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
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

          {activeSubTab === "preview" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <PreviewList
                toResponseText={JSON.stringify(responseJson, null, 2)}
              />
            </div>
          )}

          {activeSubTab === "data-selection" && (
            <TransformationConfigurator
              fromResponse={fromResponseData}
              toResponse={responseJson}
              taskId={taskId}
              onResponseUpdate={onResponseUpdate}
            />
          )}
        </>
      )}

      {!responseJson && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No preview available yet.</p>
            <p className="text-sm mt-2">
              Please fetch an endpoint first from the Endpoint Details tab.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
