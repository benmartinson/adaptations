import React, { useState, useEffect } from "react";

export default function SubTasksTab({ taskId, parentSystemTag }) {
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
        // Filter out the current task and tasks that don't have system tags
        const available = tasks.filter(
          (task) =>
            task.id !== parseInt(taskId) &&
            task.system_tag &&
            task.system_tag.trim() !== ""
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
            system_tag: selectedTask.system_tag,
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
          In this section you can add child processes, such as lists or
          sub-detail that are related to your parent process, but which data
          comes from a difference api request. For instance if your process is
          an 'Author' detail page, you could add a 'AuthorBooks' child process
          which will embed a list of books by the current author.
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
          <div className="w-1/4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sub-Process
            </label>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a process to mix...</option>
              {availableTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.system_tag}
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
              How do we construct the api endpoint for this child process, using
              the data we recieve from the parent process?
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
        </div>
      </div>
    </div>
  );
}
