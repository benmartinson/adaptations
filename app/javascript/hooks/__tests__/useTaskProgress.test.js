import { describe, expect, it } from "@jest/globals";
import { mergeSnapshot, normalizePayload } from "../useTaskProgress";

describe("mergeSnapshot", () => {
  it("merges nested fields while preserving previous values", () => {
    const previous = {
      id: 1,
      status: "running",
      tokens: { prompt: 10, completion: 5, total: 15 },
      metadata: { phase: "coding" },
      input_payload: { instructions: "hello" }
    };

    const incoming = {
      status: "running",
      tokens: { prompt: 12, completion: 7, total: 19 },
      metadata: { phase: "testing" }
    };

    const merged = mergeSnapshot(previous, incoming);

    expect(merged.tokens.total).toBe(19);
    expect(merged.metadata.phase).toBe("testing");
    expect(merged.input_payload.instructions).toBe("hello");
  });
});

describe("normalizePayload", () => {
  it("ensures a timestamp is present", () => {
    const payload = normalizePayload({ message: "hi" });
    expect(payload.timestamp).toBeDefined();
    expect(payload.message).toBe("hi");
  });
});

