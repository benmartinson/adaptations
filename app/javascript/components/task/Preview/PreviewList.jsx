import React, { useEffect, useState } from "react";
import PreviewItem from "./PreviewItem";

export default function PreviewList({
  toResponseText,
  items: directItems,
  isNested = false,
}) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If items are passed directly as an array, use them
    if (directItems) {
      if (Array.isArray(directItems)) {
        setItems(directItems);
        setError(null);
      } else {
        setError("Direct items is not an array");
      }
      return;
    }

    if (!toResponseText) {
      setItems([]);
      return;
    }

    try {
      let data;
      try {
        data = JSON.parse(toResponseText);
      } catch (e) {
        if (typeof toResponseText === "object") {
          data = toResponseText;
        } else {
          throw e;
        }
      }

      if (Array.isArray(data)) {
        setItems(data);
        setError(null);
      } else if (data && typeof data === "object") {
        const possibleList = data.items || data.data || data.results;
        if (Array.isArray(possibleList)) {
          setItems(possibleList);
          setError(null);
        } else {
          setItems([data]);
          setError(null);
        }
      } else {
        setError("Parsed data is not a list or object");
      }
    } catch (e) {
      setError("Invalid JSON format");
    }
  }, [toResponseText, directItems]);

  if (error) {
    return (
      <div className="max-w-[1260px] mx-auto w-[87.5%] mt-10">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          <p className="font-bold">Preview Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!items.length && (toResponseText || directItems)) {
    return (
      <div className="max-w-[1260px] mx-auto w-[87.5%] mt-10 text-center text-gray-500">
        No items found in response.
      </div>
    );
  }

  if (!toResponseText && !directItems) {
    return (
      <div className="max-w-[1260px] mx-auto w-[87.5%] mt-10 text-center text-gray-500">
        Waiting for response data...
      </div>
    );
  }

  return (
    <div className={isNested ? "space-y-6" : "space-y-12 pb-20"}>
      {items.map((item, index) => (
        <div key={index}>
          <PreviewItem item={item} isNested={isNested} />
          {index < items.length - 1 && (
            <div
              className={`w-full border-b border-gray-200 ${
                isNested ? "my-6" : "my-12"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
