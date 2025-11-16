import { useEffect, useMemo, useRef, useState } from "react";
import { createConsumer } from "@rails/actioncable";

const MAX_EVENTS = 200;

export default function useTaskProgress(taskId) {
  const [snapshot, setSnapshot] = useState(null);
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const channelRef = useRef(null);
  const consumerRef = useRef(null);

  useEffect(() => {
    if (!taskId) {
      setSnapshot(null);
      setEvents([]);
      setConnected(false);
      setError(null);
      return undefined;
    }

    let isActive = true;
    const abortController = new AbortController();

    fetch(`/api/tasks/${taskId}`, { signal: abortController.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Unable to load task ${taskId}`);
        }
        return response.json();
      })
      .then((data) => {
        if (isActive) {
          setSnapshot(data);
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err);
        }
      });

    const consumer = createConsumer();
    consumerRef.current = consumer;

    const subscription = consumer.subscriptions.create(
      { channel: "TaskChannel", task_id: taskId },
      {
        connected() {
          setConnected(true);
        },
        disconnected() {
          setConnected(false);
        },
        received(data) {
          const payload = normalizePayload(data);
          setSnapshot((prev) => mergeSnapshot(prev, payload));
          setEvents((prev) => {
            const next = [...prev, payload];
            return next.slice(-MAX_EVENTS);
          });
        }
      }
    );

    channelRef.current = subscription;

    return () => {
      isActive = false;
      abortController.abort();
      subscription.unsubscribe();
      consumer.disconnect();
      if (consumerRef.current === consumer) {
        consumerRef.current = null;
      }
      if (channelRef.current === subscription) {
        channelRef.current = null;
      }
    };
  }, [taskId]);

  const latestCode = useMemo(() => {
    return (
      snapshot?.metadata?.latest_code ||
      snapshot?.output?.code ||
      snapshot?.output_payload?.code ||
      ""
    );
  }, [snapshot]);

  const testResults = useMemo(() => {
    return (
      snapshot?.metadata?.test_results ||
      snapshot?.output?.tests ||
      snapshot?.output_payload?.tests ||
      []
    );
  }, [snapshot]);

  const requestStop = () => {
    channelRef.current?.perform("stop");
  };

  return {
    snapshot,
    events,
    connected,
    error,
    latestCode,
    testResults,
    requestStop
  };
}

export function mergeSnapshot(previous, incoming) {
  if (!previous) {
    return incoming;
  }

  return {
    ...previous,
    ...incoming,
    tokens: incoming.tokens || previous.tokens,
    metadata: incoming.metadata || previous.metadata,
    input_payload: incoming.input_payload || previous.input_payload,
    output_payload: incoming.output_payload || previous.output_payload || previous.output,
    output: incoming.output || previous.output,
    test_results: incoming.test_results || previous.test_results
  };
}

export function normalizePayload(payload) {
  if (!payload) {
    return {};
  }

  return {
    ...payload,
    timestamp: payload.timestamp || new Date().toISOString()
  };
}


