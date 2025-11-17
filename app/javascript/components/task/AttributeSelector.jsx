import React, { useState } from "react";

export default function AttributeSelector({ data }) {
  const attributes = Object.keys(data);
  console.log({ attributes, data });

  if (attributes.length === 0) return null;
  return (
    <div className="">
      {attributes.map((attribute) => (
        <AttributeSelectorItem attribute={attribute} data={data} />
      ))}
    </div>
  );
}

function AttributeSelectorItem({ attribute, data }) {
  const [isSelected, setIsSelected] = useState(false);
  const [transformedValue, setTransformedValue] = useState(
    JSON.stringify(data[attribute], null, 2)
  );
  const [transformDescription, setTransformDescription] = useState("");

  const [error, setError] = useState(null);
  let value = data[attribute];
  const isArray = Array.isArray(value);
  let type = isArray ? "array" : typeof value;
  type = type.charAt(0).toUpperCase() + type.slice(1);
  const isObject = typeof value === "object" && value !== null;
  const isString = typeof value === "string";
  const isNumber = typeof value === "number";
  const isBoolean = typeof value === "boolean";
  const isNull = value === null;
  const isUndefined = value === undefined;
  if (attribute === "entries") {
    console.log({ isArray, value });
  }

  const hasNestedAttributes = isObject || isArray;
  const showNestedAttributes = isSelected && hasNestedAttributes;
  const showDetailInputs = isSelected && !hasNestedAttributes;
  const showExample = isString || isNumber || isBoolean;
  if (isArray && value.length > 0) {
    value = value[0];
  } else if (isArray && value.length === 0) {
    setError(
      "This array is empty, if you want to display this attribute, please provide an endpoint that returns items for this attribute."
    );
  }

  return (
    <>
      <div
        key={attribute}
        className="flex gap-2 justify-start items-center cursor-pointer"
        onClick={() => setIsSelected(!isSelected)}
      >
        <input
          type="checkbox"
          className="cursor-pointer"
          checked={isSelected}
          onChange={() => setIsSelected(!isSelected)}
        />
        <label className="text-sm font-medium text-gray-700 cursor-pointer">
          {attribute}
        </label>
        <div className="text-xs text-gray-500"> Type: {type}</div>
      </div>
      {showNestedAttributes && (
        <div className="ml-4">
          <AttributeSelector data={value} />
        </div>
      )}
      {showDetailInputs && (
        <div className="ml-4">
          <label className="text-sm font-medium text-gray-700">
            Transformed Value
          </label>
          <span className="text-xs text-gray-500">
            {` `}(What does the example value transform into?)
          </span>
          <div className="flex flex-col gap-1">
            <div className="flex gap-1 h-6 flex items-center">
              <span className="text-xs text-gray-500 w-30">
                Example value:{" "}
              </span>
              <input
                type="text"
                className="w-20 border border-gray-300 rounded-md p-2 h-6 w-full"
                disabled
                value={JSON.stringify(value, null, 2)}
              />
            </div>
            <div className="flex gap-1 h-6 flex items-center">
              <span className="text-xs text-gray-500 w-30">
                Transforms into:{" "}
              </span>
              <input
                type="text"
                className="w-20 border border-gray-300 rounded-md p-2 h-6 w-full"
                value={transformedValue}
                onChange={(e) => setTransformedValue(e.target.value)}
              />
            </div>
            <div className="flex gap-1 h-6 flex items-center">
              <span
                className="text-xs text-gray-500 w-30"
                title="Describe how the value transforms, in psuedo-code or natural language"
              >
                Describe:{" "}
              </span>
              <input
                type="text"
                className="w-20 border border-gray-300 rounded-md p-2 h-6 w-full"
                value={transformDescription}
                onChange={(e) => setTransformDescription(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
      {error && <div className="text-red-500">{error}</div>}
    </>
  );
}
