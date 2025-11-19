import React from "react";
import moment from "moment";

export default function EventLog({ events }) {
  return (
    <section className="md:col-span-2 bg-white shadow rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Event log</h2>
        <span className="text-xs text-gray-500">
          Showing {events.length} messages
        </span>
      </div>
      {events.length === 0 && (
        <p className="text-sm text-gray-500">
          Workflow events will appear here in real time.
        </p>
      )}
      <ul className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
        {events
          .slice()
          .reverse()
          .map((event, index) => (
            <li
              key={`${event.timestamp}-${index}`}
              className="border border-gray-200 rounded-xl p-3"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-800">
                  {event.phase || "update"}
                </span>
                <span className="text-gray-500">
                  {moment(event.timestamp).fromNow()}
                </span>
              </div>
              {event.message && (
                <p className="text-sm text-gray-700 mt-1">{event.message}</p>
              )}
              {event.tokens && (
                <p className="text-xs text-gray-500 mt-1">
                  Tokens • prompt {event.tokens.prompt} / completion{" "}
                  {event.tokens.completion} / total {event.tokens.total}
                </p>
              )}
              {event.output && (
                <p className="text-sm text-gray-700 mt-1">
                  {JSON.stringify(event.output, null, 2)}
                </p>
              )}
            </li>
          ))}
      </ul>
    </section>
  );
}

