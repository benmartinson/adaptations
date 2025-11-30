import React, { useState } from "react";
import PageFrame from "../../PageFrame";
import Label from "../../common/Label";
import ImageNotFound from "../../common/ImageNotFound";
import PreviewList from "./PreviewList";

export default function PreviewItem({ item, isNested = false }) {
  const {
    header,
    subheader,
    image_url,
    attributes,
    list_items,
    list_items_header,
  } = item;
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

  const imageClass = isNested
    ? "w-[80px] h-[120px] m-auto [border-radius:0_6%_6%_0_/4%] drop-shadow-md transition-all duration-300"
    : "w-[150px] h-[230px] m-auto [border-radius:0_6%_6%_0_/4%] drop-shadow-md group-hover:scale-105 transition-all duration-300";

  const headerClass = isNested
    ? "font-fancy text-[24px] leading-[32px] font-[600]"
    : "font-fancy text-[36px] leading-[46px] font-[600]";

  const subheaderClass = isNested
    ? "font-fancy italic text-[16px] leading-[22px] text-[#707070] mb-1"
    : "font-fancy italic text-[20px] leading-[28px] text-[#707070] mb-2";

  const Wrapper = isNested ? "div" : PageFrame;
  const wrapperProps = isNested
    ? { className: "grid grid-cols-12 gap-4 items-start" }
    : {};

  return (
    <Wrapper {...wrapperProps}>
      <div
        className={`${isNested ? "col-span-2" : "col-span-3"} self-start ${
          isNested ? "" : "sticky top-20"
        }`}
      >
        {image_url && !imageError ? (
          <img
            src={image_url}
            alt={header || "Item image"}
            className={imageClass}
            onError={() => setImageError(true)}
          />
        ) : (
          <ImageNotFound size={isNested ? "tiny" : "small"} />
        )}
      </div>
      <div className={isNested ? "col-span-10" : "col-span-9"}>
        <h1 className={headerClass}>{header || "Untitled"}</h1>
        {subheader && <div className={subheaderClass}>{subheader}</div>}

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

        {list_items && Array.isArray(list_items) && list_items.length > 0 && (
          <div className={isNested ? "mt-4" : "mt-6"}>
            <h4
              className={`font-fancy font-[600] font-bold border-b border-gray-200 pb-2 mb-3 ${
                isNested
                  ? "text-[12px] leading-[16px]"
                  : "text-[14px] leading-[20px]"
              }`}
            >
              {list_items_header ? list_items_header : "Related Items"}
            </h4>
            <PreviewList items={list_items} isNested={true} />
          </div>
        )}
      </div>
    </Wrapper>
  );
}
