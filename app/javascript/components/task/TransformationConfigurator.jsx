import React from "react";

export default function TransformationConfigurator({
  fromResponse,
  toResponse,
}) {
  const fromResponseText = fromResponse
    ? JSON.stringify(fromResponse, null, 2)
    : "";
  const toResponseText = toResponse ? JSON.stringify(toResponse, null, 2) : "";

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        View and compare the original API response with the transformed output.
      </p>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From response (JSON)
          </label>
          <textarea
            className="w-full rounded-lg border border-gray-300 p-3 font-mono text-sm h-80 focus:ring-2 focus:ring-blue-500 bg-gray-50"
            value={fromResponseText}
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To response (JSON)
          </label>
          <textarea
            className="w-full rounded-lg border border-gray-300 p-3 font-mono text-sm h-80 focus:ring-2 focus:ring-blue-500 bg-gray-50"
            value={toResponseText}
            readOnly
          />
        </div>
      </div>
    </div>
  );
}
