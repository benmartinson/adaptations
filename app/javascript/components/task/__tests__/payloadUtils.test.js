import { describe, expect, it } from "@jest/globals";
import { normalizeArray, safeParse } from "../payloadUtils";

describe("safeParse", () => {
  it("parses valid JSON", () => {
    expect(safeParse('{"a":1}')).toEqual({ a: 1 });
  });

  it("throws on invalid JSON", () => {
    expect(() => safeParse("{oops}")).toThrow("Invalid JSON payload");
  });
});

describe("normalizeArray", () => {
  it("returns arrays as-is", () => {
    expect(normalizeArray([1, 2])).toEqual([1, 2]);
  });

  it("wraps non-arrays", () => {
    expect(normalizeArray({ a: 1 })).toEqual([{ a: 1 }]);
    expect(normalizeArray(null)).toEqual([]);
  });
});

