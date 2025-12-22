import React, { useState, useEffect } from "react";

export default function SubTaskCard({
  subTask,
  taskId,
  onUpdate,
  onDelete,
  initialExpanded = false,
}) {
  const [isEditing, setIsEditing] = useState(initialExpanded);
  const [notes, setNotes] = useState(subTask.notes || "");
  const [endpointNotes, setEndpointNotes] = useState(
    subTask.endpoint_notes || ""
  );
  const [isSaving, setIsSaving] = useState(false);

  // Sync local state when subTask prop changes
  useEffect(() => {
    setNotes(subTask.notes || "");
    setEndpointNotes(subTask.endpoint_notes || "");
  }, [subTask.notes, subTask.endpoint_notes]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/tasks/${taskId}/sub_tasks/${subTask.id}/generate_ui`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sub_task: {
              notes: notes.trim(),
            },
          }),
        }
      );

      if (response.ok) {
        const updatedSubTask = await response.json();
        onUpdate?.(updatedSubTask);
        setIsEditing(false);
      } else {
        const error = await response.json();
        alert(`Failed to generate UI: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to generate UI:", error);
      alert("Failed to generate UI");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setNotes(subTask.notes || "");
    setEndpointNotes(subTask.endpoint_notes || "");
    setIsEditing(false);
  };

  const needsConfiguration = !subTask.notes && !subTask.endpoint_notes;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Header with system tags and action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-medium">
            {subTask.system_tag}
          </code>
          {needsConfiguration && !isEditing && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
              Needs configuration
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Edit button */}
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              isEditing
                ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            aria-label="Edit placement"
            title="Edit placement"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          {/* Delete button */}
          <button
            type="button"
            onClick={() => onDelete(subTask.id)}
            className="p-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200 cursor-pointer transition-colors"
            aria-label="Remove sub-task"
            title="Remove sub-task"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Display mode - show current notes */}
      {!isEditing && (subTask.notes || subTask.endpoint_notes) && (
        <div className="mt-3 space-y-2">
          {subTask.notes && (
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-700">Placement:</span>{" "}
              {subTask.notes}
            </p>
          )}
          {subTask.endpoint_notes && (
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-700">
                Endpoint Construction:
              </span>{" "}
              {subTask.endpoint_notes}
            </p>
          )}
        </div>
      )}

      {/* Edit mode - show form fields */}
      {isEditing && (
        <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Where in the interface should this be placed?
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Describe where this sub-process should appear..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-gray-800 text-white hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? "Generating..." : "Generate UI Change"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
