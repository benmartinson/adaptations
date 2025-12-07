import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import PreviewList from "../Preview/PreviewList";

export default function TestPreviewPage() {
  const { task_id } = useParams();
  const [tests, setTests] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function loadTests() {
      try {
        const response = await fetch(`/api/tasks/${task_id}`);
        if (!response.ok) {
          throw new Error("Unable to load task");
        }
        const data = await response.json();
        setTests(data.tests || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadTests();
  }, [task_id]);

  const test = tests[currentIndex];
  const hasMultipleTests = tests.length > 1;

  function handleNextTest() {
    setCurrentIndex((prev) => (prev + 1) % tests.length);
  }

  function handlePrevTest() {
    setCurrentIndex((prev) => (prev - 1 + tests.length) % tests.length);
  }

  async function handleMarkAsPassed() {
    if (!test) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/tasks/${task_id}/tests/${test.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: { status: "pass" } }),
      });
      if (!response.ok) {
        throw new Error("Unable to update test");
      }
      const data = await response.json();
      setTests((prev) => prev.map((t) => (t.id === data.id ? data : t)));
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Preview
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to={`/task/${task_id}/tests`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Tests
          </Link>
        </div>
      </div>
    );
  }

  if (tests.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Tests Available
          </h2>
          <p className="text-gray-600 mb-6">
            No tests have been run yet for this task.
          </p>
          <Link
            to={`/task/${task_id}/tests`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Tests
          </Link>
        </div>
      </div>
    );
  }

  const actualOutput = test?.actual_output;

  if (!actualOutput) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Output Available
          </h2>
          <p className="text-gray-600 mb-6">
            This test hasn't been run yet or has no output to preview.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              to={`/task/${task_id}/tests`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Back to Tests
            </Link>
            {hasMultipleTests && (
              <button
                type="button"
                onClick={handleNextTest}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Next Test
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-indigo-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to={`/task/${task_id}/tests`}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Tests
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Test Preview
                {hasMultipleTests && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({currentIndex + 1} of {tests.length})
                  </span>
                )}
              </h1>
              <p className="text-sm text-gray-500 truncate max-w-md">
                {test.api_endpoint || "Test Preview"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {hasMultipleTests && (
              <>
                <button
                  type="button"
                  onClick={handlePrevTest}
                  className="p-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                  title="Previous Test"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleNextTest}
                  className="p-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                  title="Next Test"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </>
            )}
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                test.status === "pass"
                  ? "bg-green-100 text-green-700"
                  : test.status === "fail"
                  ? "bg-red-100 text-red-700"
                  : test.status === "needs_review"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {test.status === "pass"
                ? "Passed"
                : test.status === "fail"
                ? "Failed"
                : test.status === "needs_review"
                ? "Needs Review"
                : test.status}
            </span>
            {test.status === "needs_review" && (
              <button
                type="button"
                onClick={handleMarkAsPassed}
                disabled={updating}
                className="px-4 py-1.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? "Updating..." : "Mark as Passed"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-indigo-100">
            <h2 className="text-sm font-medium text-indigo-900">
              Transformed Output Preview
            </h2>
            <p className="text-xs text-indigo-600 mt-0.5">
              See how the transformed data renders with UI components
            </p>
          </div>
          <div className="p-6">
            <PreviewList
              toResponseText={JSON.stringify(actualOutput, null, 2)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
