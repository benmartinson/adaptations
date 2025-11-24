import React, { useEffect, useState } from "react";
import PageFrame from "../PageFrame";
import Label from "../common/Label";
import ImageNotFound from "../common/ImageNotFound";

const PreviewItem = ({ item }) => {
  const { header, subheader, image_url, attributes } = item;
  const [imageError, setImageError] = useState(false);

  const descriptionKeys = ["description", "summary", "overview", "plot"];

  let description = "";
  const otherAttributes = {};

  if (attributes && typeof attributes === "object") {
    Object.entries(attributes).forEach(([key, value]) => {
      if (
        descriptionKeys.includes(key.toLowerCase()) &&
        typeof value === "string"
      ) {
        if (!description) description = value;
      } else {
        otherAttributes[key] = value;
      }
    });
  }
  console.log({ image_url });

  return (
    <PageFrame>
      <div className="col-span-3 self-start sticky top-20">
        {image_url && !imageError ? (
          <img
            src={image_url}
            alt={header || "Item image"}
            className="w-[150px] h-[230px] m-auto [border-radius:0_6%_6%_0_/4%] drop-shadow-md group-hover:scale-105 transition-all duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <ImageNotFound size="small" />
        )}
      </div>
      <div className="col-span-9">
        {subheader && (
          <div className="font-fancy italic text-[20px] leading-[28px] text-[#707070] mb-2">
            {subheader}
          </div>
        )}
        <h1 className="font-fancy text-[36px] leading-[46px] font-[600]">
          {header || "Untitled"}
        </h1>

        <div className="font-body mt-3">
          {description && (
            <div className="mb-6">
              <p className="whitespace-pre-wrap">{description}</p>
            </div>
          )}

          {Object.keys(otherAttributes).length > 0 && (
            <div className="mt-3">
              <h4 className="font-fancy text-[14px] leading-[20px] font-[600] font-bold mt-6 border-b border-gray-200 pb-2 mb-3">
                Attributes
              </h4>
              {Object.entries(otherAttributes).map(([key, value]) => (
                <Label
                  key={key}
                  label={
                    key.charAt(0).toUpperCase() +
                    key.slice(1).replace(/_/g, " ")
                  }
                  value={String(value)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageFrame>
  );
};

export default function PreviewList({ toResponseText }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
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
  }, [toResponseText]);

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

  if (!items.length && toResponseText) {
    return (
      <div className="max-w-[1260px] mx-auto w-[87.5%] mt-10 text-center text-gray-500">
        No items found in response.
      </div>
    );
  }

  if (!toResponseText) {
    return (
      <div className="max-w-[1260px] mx-auto w-[87.5%] mt-10 text-center text-gray-500">
        Waiting for response data...
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {items.map((item, index) => (
        <div key={index}>
          <PreviewItem item={item} />
          {index < items.length - 1 && (
            <div className="w-full border-b border-gray-200 my-12" />
          )}
        </div>
      ))}
    </div>
  );
}
