export function limitArraySizes(obj, maxArraySize = 10) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj
      .slice(0, maxArraySize)
      .map((item) => limitArraySizes(item, maxArraySize));
  }

  const result = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      result[key] = limitArraySizes(obj[key], maxArraySize);
    }
  }

  return result;
}

export const ELEMENT_TYPES = {
  horizontal_cards: "Horizontal Cards",
  vertical_cards: "Vertical Cards",
  detail_page: "Detail Page",
  generated_page: "Generated Page",
};

export async function fetchEndpointData(apiEndpoint, maxArraySize = 10) {
  const response = await fetch(apiEndpoint);
  if (!response.ok) {
    throw new Error("Unable to fetch from endpoint");
  }

  const text = await response.text();
  let fetchedData;
  try {
    fetchedData = JSON.parse(text);
    // Limit array sizes to reduce token usage
    fetchedData = limitArraySizes(fetchedData, maxArraySize);
  } catch {
    fetchedData = text;
  }

  return fetchedData;
}

export function filterTasksByKind(tasks, kind) {
  return tasks.filter((task) => task.kind === kind);
}
