import React, { useState, useEffect } from "react";
import PreviewList from "./PreviewList";
import DynamicUIFile from "./DynamicUIFile";
import Modal from "../../common/Modal";
import useTaskProgress from "../../../hooks/useTaskProgress";

export default function UIPreviewTab({
  isGeneratingPreview,
  onNextStep,
  taskId,
  onRequestChanges,
}) {
  const { responseJson } = useTaskProgress(taskId);
  const [cyclingMessage, setCyclingMessage] = useState(
    "Generating UI Preview..."
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [changeDescription, setChangeDescription] = useState("");

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

  const handleRequestChanges = () => {
    setIsModalOpen(false);
    onRequestChanges(changeDescription);
  };

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
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-gray-200 text-black font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Request Changes
              </button>
              <button
                type="button"
                onClick={onNextStep}
                className="px-4 py-2 rounded-lg bg-gray-800 text-white font-semibold hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Next Step
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full">
            <DynamicUIFile taskId={taskId} responseJson={responseJson} />
          </div>
        </>
      )}

      {!responseJson && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No preview available yet.</p>
          </div>
        </div>
      )}

      {/* Request Changes Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Request Changes"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What specific changes do you wish to make? (The more detail, the
              better)
            </label>
            <textarea
              value={changeDescription}
              onChange={(e) => setChangeDescription(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe the specific changes you want to make..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleRequestChanges}
              disabled={!changeDescription.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-800 border border-transparent rounded-md hover:bg-gray-900 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Request
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
