import React from "react";
import { useImageError } from "../../hooks/useImageError";
import ImageNotFound from "./ImageNotFound";

export default function HorizontalCardList({ title, items, onItemClick }) {
  const { hasImageError, markImageError } = useImageError();

  return (
    <div>
      {title && (
        <h4 className="font-fancy text-[14px] leading-[20px] font-[600] font-bold mt-6">
          {title}
        </h4>
      )}
      <div className="flex flex-start gap-8 mt-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="group"
            onClick={() => onItemClick && onItemClick(item)}
          >
            {item.imageUrl && !hasImageError(item.id) && (
              <img
                src={item.imageUrl}
                alt={item.firstLineText || ""}
                className="w-[150px] h-[230px] m-auto [border-radius:0_6%_6%_0_/4%] drop-shadow-md group-hover:scale-105 transition-all duration-300"
                onError={() => markImageError(item.id)}
              />
            )}
            {hasImageError(item.id) && <ImageNotFound />}
            <div className="text-[#707070] text-[14px] leading-[18px] font-body mt-2 w-[150px] max-w-[150px]">
              {item.firstLineText && (
                <div className="">{item.firstLineText}</div>
              )}
              {item.secondLineText && (
                <div className="line-break  ">{item.secondLineText}</div>
              )}
              {item.thirdLineText && (
                <div className="">{item.thirdLineText}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
