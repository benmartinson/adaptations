import React from "react";
import { useImageError } from "../../hooks/useImageError";
import ImageNotFound from "./ImageNotFound";

export default function VerticalCardList({ title, items, onItemClick }) {
  const { hasImageError, markImageError } = useImageError();

  return (
    <div>
      {title && (
        <h4 className="font-fancy text-[14px] leading-[20px] font-[600] font-bold mt-6">
          {title}
        </h4>
      )}
      <div className="flex flex-col gap-4 mt-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="group flex items-start gap-4 cursor-pointer"
            onClick={() => onItemClick && onItemClick(item)}
          >
            {item.imageUrl && !hasImageError(item.id) && (
              <img
                src={item.imageUrl}
                alt={item.firstLineText || ""}
                className="w-[80px] h-[125px] flex-shrink-0 [border-radius:0_6%_6%_0_/4%] drop-shadow-md group-hover:scale-105 transition-all duration-300"
                onError={() => markImageError(item.id)}
              />
            )}
            {hasImageError(item.id) && (
              <div className="flex-shrink-0">
                <ImageNotFound />
              </div>
            )}
            <div className="flex flex-col justify-center flex-1">
              {item.firstLineText && (
                <div className="font-bold text-[14px] leading-[18px] font-body">
                  {item.firstLineText}
                </div>
              )}
              {item.secondLineText && (
                <div className="text-[#707070] text-[12px] leading-[16px] font-body mt-1">
                  {item.secondLineText}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
