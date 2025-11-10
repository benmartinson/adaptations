import React from "react";
import { useImageError } from "../../hooks/useImageError";

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
            {hasImageError(item.id) && (
              <div className="w-[150px] h-[230px] m-auto [border-radius:0_6%_6%_0_/4%] drop-shadow-md bg-gray-200 flex items-center justify-center border-2 border-dashed border-gray-400">
                <div className="text-center text-gray-500">
                  <svg
                    className="w-16 h-16 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm">Image not available</p>
                </div>
              </div>
            )}
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
