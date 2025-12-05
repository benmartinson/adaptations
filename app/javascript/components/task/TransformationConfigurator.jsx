import React, { useState, useEffect } from "react";

export default function TransformationConfigurator({
  fromResponse,
  toResponse,
  taskId,
  onResponseUpdate,
}) {
  const [showInstructions, setShowInstructions] = useState(true);
  const [toResponseText, setToResponseText] = useState("");
  const [saveStatus, setSaveStatus] = useState(null);

  const fromResponseText = fromResponse
    ? JSON.stringify(fromResponse, null, 2)
    : "";

  useEffect(() => {
    if (toResponse) {
      setToResponseText(JSON.stringify(toResponse, null, 2));
    }
  }, [toResponse]);

  async function handleSave() {
    if (!taskId) return;

    try {
      const parsedJson = JSON.parse(toResponseText);
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

  return (
    <div className="space-y-2">
      {showInstructions && (
        <>
          <p className="text-sm text-gray-600">
            View and compare the original API response with the transformed
            output. The AI Assistant tried to guess the best way to transform
            the data, based on the data it received from the API endpoint you
            provided. Here are the original response and transformed data it
            generated.
          </p>
          <p className="text-sm text-gray-600">
            You can adjust the transformed data to your liking by selecting the
            data you want to include and the format you want it in. To show the
            UI Preview correctly, these keys must be included in the transformed
            data: header, subheader, image_url, attributes (array of key-value
            pairs), list_items_header, list_items (nested list of items with the
            same keys as the original response).
          </p>
        </>
      )}
      <button
        className="text-sm text-blue-500 cursor-pointer"
        onClick={() => setShowInstructions(!showInstructions)}
      >
        {showInstructions ? "Hide instructions" : "Show instructions"}
      </button>
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
