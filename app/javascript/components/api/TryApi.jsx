import React, { useState } from "react";

export default function TryApi() {
  const [fromResponse, setFromResponse] = useState("");
  const [toResponse, setToResponse] = useState("");
  const [response, setResponse] = useState("");

  const handleSubmit = () => {
    const url = `/api/try_api`;
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fromResponse, toResponse }),
    })
      .then((res) => res.json())
      .then((data) => {
        setResponse(data.response);
        console.log(data.response);
      });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="from-response"
          className="block text-sm font-medium text-gray-700"
        >
          From Response
        </label>
        <textarea
          id="from-response"
          rows={10}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm"
          value={fromResponse}
          onChange={(e) => setFromResponse(e.target.value)}
          placeholder="Enter the 'from' response here..."
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="to-response"
          className="block text-sm font-medium text-gray-700"
        >
          To Response
        </label>
        <textarea
          id="to-response"
          rows={10}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm"
          value={toResponse}
          onChange={(e) => setToResponse(e.target.value)}
          placeholder="Enter the 'to' response here..."
        />
      </div>
      <div className="flex justify-center">
        <button
          onClick={handleSubmit}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
        >
          Submit
        </button>
      </div>
      <div className="space-y-2">
        <label
          htmlFor="response"
          className="block text-sm font-medium text-gray-700"
        >
          Response
        </label>
        <textarea
          id="response"
          rows={10}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-50 resize-none font-mono text-sm"
          value={response}
          readOnly
          placeholder="Response will appear here..."
        />
      </div>
    </div>
  );
}
