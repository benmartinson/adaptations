import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SubTaskCard from "./SubTaskCard";

export default function SubTasksTab({ taskId, parentSystemTag }) {
  const navigate = useNavigate();
  const [subTasks, setSubTasks] = useState([]);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddSubTask, setShowAddSubTask] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newlyCreatedId, setNewlyCreatedId] = useState(null);

  useEffect(() => {
    loadSubTasks();
    loadAvailableTasks();
  }, [taskId, parentSystemTag]);

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

  const handleAddSubTask = async () => {
    if (!selectedTaskId) {
      return;
    }

    const selectedTask = availableTasks.find(
      (t) => t.id === parseInt(selectedTaskId)
    );
    if (!selectedTask) {
      alert("Selected task not found");
      return;
    }

    setIsAdding(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/create_sub_task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sub_task: {
            system_tag: selectedTask.to_system_tag,
            parent_system_tag: parentSystemTag || "",
            notes: "",
          },
        }),
      });

      if (response.ok) {
        const newSubTask = await response.json();
        setSubTasks([newSubTask, ...subTasks]);
        setNewlyCreatedId(newSubTask.id);
        setSelectedTaskId("");
        setShowAddSubTask(false);
      } else {
        const error = await response.json();
        alert(`Failed to create sub-task: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to create sub-task:", error);
      alert("Failed to create sub-task");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteSubTask = async (subTaskId) => {
    if (
      !confirm("Are you sure you want to delete this sub-task relationship?")
    ) {
      return;
    }

    try {
      // First trigger UI cleanup while the subtask still exists
      try {
        await fetch(`/api/tasks/${taskId}/sub_tasks/${subTaskId}/generate_ui`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_delete: true,
          }),
        });
      } catch (error) {
        console.error("Failed to trigger UI cleanup:", error);
        // Continue with deletion even if cleanup fails
      }

      // Then delete the subtask
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

  const handleUpdateSubTask = (updatedSubTask) => {
    setSubTasks(
      subTasks.map((st) => (st.id === updatedSubTask.id ? updatedSubTask : st))
    );
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
    <div className="space-y-3">
      {/* Header with Embed Sub-Process button */}
      <div className="flex items-center">
        <div className="flex justify-end w-full items-center gap-2">
          {availableTasks.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAddSubTask(!showAddSubTask)}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer flex items-center gap-1.5 transition-colors"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Sub-Process
            </button>
          )}
          <button
            type="button"
            onClick={handleCreateConnection}
            className="px-3 py-1.5 text-sm font-medium rounded-md bg-gray-800 text-white hover:bg-gray-900 cursor-pointer transition-colors"
          >
            Create New Connection
          </button>
        </div>
      </div>

      {/* Embed Sub-Process inline form */}
      {showAddSubTask && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex gap-3">
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:ring-0 focus:outline-none"
            >
              <option value="">Select a process to embed...</option>
              {availableTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.to_system_tag}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddSubTask}
              disabled={isAdding || !selectedTaskId}
              className="px-3 py-1.5 text-sm rounded-md bg-gray-900 text-white font-medium hover:bg-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAdding ? "Adding..." : "Add"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddSubTask(false);
                setSelectedTaskId("");
              }}
              className="px-3 py-1.5 text-sm rounded-md bg-gray-100 text-gray-700 font-medium hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Sub-Task cards */}
      {subTasks.map((subTask) => (
        <SubTaskCard
          key={subTask.id}
          subTask={subTask}
          taskId={taskId}
          onUpdate={handleUpdateSubTask}
          onDelete={handleDeleteSubTask}
          initialExpanded={subTask.id === newlyCreatedId}
        />
      ))}

      {/* Empty state */}
      {subTasks.length === 0 && availableTasks.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
              then return here to embed sub-processes.
            </p>
          </div>
        </div>
      )}

      {/* Empty state when there are available tasks but no sub-tasks yet */}
      {subTasks.length === 0 &&
        availableTasks.length > 0 &&
        !showAddSubTask && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-500 text-sm">
              No sub-tasks configured yet. Click "Embed Sub-Process" to embed a
              connected process.
            </p>
          </div>
        )}
    </div>
  );
}
