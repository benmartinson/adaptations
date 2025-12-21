import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SubTasksTab({ taskId, parentSystemTag }) {
  const navigate = useNavigate();
  const [subTasks, setSubTasks] = useState([]);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [notes, setNotes] = useState("");
  const [endpointNotes, setEndpointNotes] = useState("");

  useEffect(() => {
    loadSubTasks();
    loadAvailableTasks();
  }, [taskId]);

  const loadSubTasks = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/sub_tasks`);
      if (response.ok) {
        const data = await response.json();
        setSubTasks(data);
      }
    } catch (error) {
      console.error("Failed to load sub-tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableTasks = async () => {
    try {
      const response = await fetch("/api/tasks");
      if (response.ok) {
        const tasks = await response.json();
        // Only show link tasks where the system_tag matches our parent system tag
        const available = tasks.filter(
          (task) =>
            task.kind === "link" &&
            task.system_tag === parentSystemTag &&
            task.to_system_tag
        );
        setAvailableTasks(available);
      }
    } catch (error) {
      console.error("Failed to load available tasks:", error);
    }
  };

  const handleCreateSubTask = async () => {
    if (!selectedTaskId) {
      alert("Please select a sub-process");
      return;
    }

    const selectedTask = availableTasks.find(
      (t) => t.id === parseInt(selectedTaskId)
    );
    if (!selectedTask) {
      alert("Selected task not found");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/create_sub_task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sub_task: {
            task_id: selectedTask.id,
            system_tag: selectedTask.to_system_tag,
            parent_system_tag: parentSystemTag || "",
            notes: notes.trim(),
            endpoint_notes: endpointNotes.trim(),
          },
        }),
      });

      if (response.ok) {
        const newSubTask = await response.json();
        setSubTasks([...subTasks, newSubTask]);
        setSelectedTaskId("");
        setNotes("");
        setEndpointNotes("");
      } else {
        const error = await response.json();
        alert(`Failed to create sub-task: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to create sub-task:", error);
      alert("Failed to create sub-task");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSubTask = async (subTaskId) => {
    if (
      !confirm("Are you sure you want to delete this sub-task relationship?")
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/tasks/${taskId}/sub_tasks/${subTaskId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setSubTasks(subTasks.filter((st) => st.id !== subTaskId));
      } else {
        alert("Failed to delete sub-task");
      }
    } catch (error) {
      console.error("Failed to delete sub-task:", error);
      alert("Failed to delete sub-task");
    }
  };

  const handleCreateConnection = async () => {
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: {
            kind: "link",
            metadata: { source: "web-ui", parent_system_tag: parentSystemTag },
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to create connection");
      }

      const task = await response.json();
      console.log({ parentSystemTag: encodeURIComponent(parentSystemTag) });
      navigate(
        `/link/${task.id}/details?from=${encodeURIComponent(parentSystemTag)}`
      );
    } catch (error) {
      console.error("Failed to create connection:", error);
      alert("Failed to create connection");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading sub-tasks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-gray-700">
        <p className="text-sm leading-relaxed">
          In this section you can embed child processes that are connected via
          connector processes. Only processes that have established data
          connections (through connector processes) to your current process will
          appear here. Use this to create composite interfaces where related
          data from different API endpoints is displayed together.
        </p>
      </div>

      {subTasks.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="space-y-3">
            {subTasks.map((subTask) => (
              <div
                key={subTask.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="space-y-1">
                  <p className="font-medium">
                    System Tag:{" "}
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {subTask.system_tag}
                    </code>
                  </p>
                  <p className="text-sm text-gray-600">
                    Parent System Tag:{" "}
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {subTask.parent_system_tag}
                    </code>
                  </p>
                  {subTask.notes && (
                    <p className="text-sm text-gray-500 italic">
                      Placement: {subTask.notes}
                    </p>
                  )}
                  {subTask.endpoint_notes && (
                    <p className="text-sm text-gray-500 italic">
                      API Construction: {subTask.endpoint_notes}
                    </p>
                  )}
                  <p className="text-sm text-gray-400">
                    Task ID: {subTask.task_id}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteSubTask(subTask.id)}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          {availableTasks.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-2">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">
                No connector processes available
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Create a connector process first to establish data connections,
                then return here to embed connector processes into your
                interface.
              </p>
              <div className="mt-6">
                <button
                  onClick={handleCreateConnection}
                  className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900"
                >
                  Create Connection
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="w-1/4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sub-Process
                </label>
                <select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">
                    Select a linked process to connect...
                  </option>
                  {availableTasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.to_system_tag}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Where in the interface should this be placed?
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  How do we construct the api endpoint for this child process,
                  using the data we recieve from the parent process?
                </label>
                <textarea
                  value={endpointNotes}
                  onChange={(e) => setEndpointNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <button
                onClick={handleCreateSubTask}
                disabled={creating || !selectedTaskId}
                className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? "Generating..." : "Generate UI Change"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
