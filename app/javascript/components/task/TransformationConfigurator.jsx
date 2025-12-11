import React, { useState, useEffect } from "react";
import useTaskProgress from "../../hooks/useTaskProgress";

export default function TransformationConfigurator({
  fromResponse,
  toResponse,
  taskId,
  onResponseUpdate,
  isLinkTask = false,
}) {
  const { dataDescription: snapshotDataDescription } = useTaskProgress(taskId);
  const [showInstructions, setShowInstructions] = useState(true);
  const [toResponseText, setToResponseText] = useState("");
  const [saveStatus, setSaveStatus] = useState(null);
  const [dataDescription, setDataDescription] = useState("");
  const [explanationSaveStatus, setExplanationSaveStatus] = useState(null);

  useEffect(() => {
    if (snapshotDataDescription !== undefined) {
      setDataDescription(snapshotDataDescription || "");
    }
  }, [snapshotDataDescription]);

  const fromResponseText = fromResponse
    ? JSON.stringify(fromResponse, null, 2)
    : "";

  useEffect(() => {
    if (toResponse) {
      // For link tasks, toResponse might be a string (api_endpoint URL)
      if (typeof toResponse === "string") {
        setToResponseText(toResponse);
      } else {
        setToResponseText(JSON.stringify(toResponse, null, 2));
      }
    }
  }, [toResponse]);

  async function handleSave() {
    if (!taskId) return;

    try {
      const parsedJson = isLinkTask
        ? toResponseText
        : JSON.parse(toResponseText);
      setSaveStatus("saving");

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: {
            response_json: parsedJson,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(null), 2000);

      if (onResponseUpdate) {
        onResponseUpdate(parsedJson);
      }
    } catch (error) {
      console.error("Error saving response:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(null), 3000);
    }
  }

  async function handleSaveDataDescription() {
    if (!taskId) return;

    try {
      setExplanationSaveStatus("saving");

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: {
            data_description: dataDescription,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      setExplanationSaveStatus("saved");
      setTimeout(() => setExplanationSaveStatus(null), 2000);
    } catch (error) {
      console.error("Error saving link explanation:", error);
      setExplanationSaveStatus("error");
      setTimeout(() => setExplanationSaveStatus(null), 3000);
    }
  }

  return (
    <div className="space-y-4">
      {showInstructions && (
        <>
          {isLinkTask ? (
            <p className="text-sm text-gray-600">
              Explain how to get from the 'From Response' to the 'To Response'
              below. Edit the 'To Response' to represent what the resulting API
              endpoint should be if we started with the fetched data shown as
              the 'From Response'.
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                View and compare the original API response with the transformed
                output. The AI Assistant tried to guess the best way to
                transform the data, based on the data it received from the API
                endpoint you provided. Here are the original response and
                transformed data it generated.
              </p>
              <p className="text-sm text-gray-600">
                You can adjust the transformed data to your liking by selecting
                the data you want to include and the format you want it in. To
                show the UI Preview correctly, these keys must be included in
                the transformed data: header, subheader, image_url, attributes
                (array of key-value pairs), list_items_header, list_items
                (nested list of items with the same keys as the original
                response).
              </p>
            </>
          )}
        </>
      )}
      <button
        className="text-sm text-blue-500 cursor-pointer"
        onClick={() => setShowInstructions(!showInstructions)}
      >
        {showInstructions ? "Hide instructions" : "Show instructions"}
      </button>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            {isLinkTask ? "Link Explanation" : "Data Description"}
          </label>
          {explanationSaveStatus && (
            <span
              className={`text-xs ${
                explanationSaveStatus === "saving"
                  ? "text-gray-500"
                  : explanationSaveStatus === "saved"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {explanationSaveStatus === "saving"
                ? "Saving..."
                : explanationSaveStatus === "saved"
                ? "Saved!"
                : "Error saving"}
            </span>
          )}
        </div>
        <textarea
          className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-blue-500 bg-white"
          placeholder="Explain how the data should be transformed from the source to the destination..."
          value={dataDescription}
          onChange={(e) => setDataDescription(e.target.value)}
          onBlur={handleSaveDataDescription}
          rows={3}
        />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From response (JSON)
          </label>
          <textarea
            className="w-full h-[800px] rounded-lg border border-gray-300 p-3 font-mono text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50"
            value={fromResponseText}
            readOnly
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">
              To response (JSON)
            </label>
            {saveStatus && (
              <span
                className={`text-xs ${
                  saveStatus === "saving"
                    ? "text-gray-500"
                    : saveStatus === "saved"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {saveStatus === "saving"
                  ? "Saving..."
                  : saveStatus === "saved"
                  ? "Saved!"
                  : "Error saving"}
              </span>
            )}
          </div>
          <textarea
            className="w-full h-[800px] rounded-lg border border-gray-300 p-3 font-mono text-sm focus:ring-2 focus:ring-blue-500 bg-white"
            value={toResponseText}
            onChange={(e) => setToResponseText(e.target.value)}
            onBlur={handleSave}
          />
        </div>
      </div>
    </div>
  );
}
