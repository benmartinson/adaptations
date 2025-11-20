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
