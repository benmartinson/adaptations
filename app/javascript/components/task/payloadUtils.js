export function safeParse(value) {
  try {
    return JSON.parse(value || "null");
  } catch (error) {
    throw new Error("Invalid JSON payload");
  }
}

export function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}

