import React, { useState, useEffect, useRef } from "react";

const STATUS_CONFIG = {
  pass: {
    className: "bg-green-100 text-green-700",
    label: "Passed",
  },
  passed: {
    className: "bg-green-100 text-green-700",
    label: "Passed",
  },
  fail: {
    className: "bg-red-100 text-red-700",
    label: "Failed",
  },
  failed: {
    className: "bg-red-100 text-red-700",
    label: "Failed",
  },
  pending: {
    className: "bg-yellow-100 text-yellow-700",
    label: "Running",
  },
  needs_review: {
    className: "bg-red-100 text-red-700",
    label: "Needs Review",
  },
  changes_needed: {
    className: "bg-purple-100 text-purple-700",
    label: "Changes Requested",
  },
  error: {
    className: "bg-orange-100 text-orange-700",
    label: "Error",
  },
  created: {
    className: "bg-gray-100 text-gray-700",
    label: "Created",
  },
};

const DEFAULT_CONFIG = {
  className: "bg-gray-100 text-gray-700",
};

const MIN_PENDING_DISPLAY_MS = 2000;

export default function StatusBadge({ status, size = "md" }) {
  const [displayedStatus, setDisplayedStatus] = useState(status);
  const pendingStartTime = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // If switching TO pending, update immediately and record the time
    if (status === "pending") {
      setDisplayedStatus("pending");
      pendingStartTime.current = Date.now();
      return;
    }

    // If switching FROM pending, ensure minimum display time
    if (displayedStatus === "pending" && pendingStartTime.current) {
      const elapsed = Date.now() - pendingStartTime.current;
      const remaining = MIN_PENDING_DISPLAY_MS - elapsed;

      if (remaining > 0) {
        timeoutRef.current = setTimeout(() => {
          setDisplayedStatus(status);
          pendingStartTime.current = null;
        }, remaining);
        return;
      }
    }

    // Otherwise update immediately
    setDisplayedStatus(status);
    pendingStartTime.current = null;
  }, [status]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const config = STATUS_CONFIG[displayedStatus] || DEFAULT_CONFIG;
  const label = config.label || displayedStatus;

  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span
      className={`${sizeClass} rounded-full font-medium ${config.className}`}
    >
      {label}
    </span>
  );
}
