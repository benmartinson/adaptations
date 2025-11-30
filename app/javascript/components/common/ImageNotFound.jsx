import React from "react";

export default function ImageNotFound({ size = "large" }) {
  const sizeClasses = {
    tiny: "w-[80px] h-[120px]",
    small: "w-[150px] h-[230px]",
    large: "w-[210px] h-[320px]",
  };
  const sizeClass = sizeClasses[size] || sizeClasses.large;

  const iconClasses = {
    tiny: "w-8 h-8",
    small: "w-16 h-16 mb-2",
    large: "w-16 h-16 mb-2",
  };
  const iconClass = iconClasses[size] || iconClasses.large;

  return (
    <div
      className={`${sizeClass} m-auto [border-radius:0_6%_6%_0_/4%] drop-shadow-md bg-gray-200 flex items-center justify-center border-2 border-dashed border-gray-400`}
    >
      <div className="text-center text-gray-500">
        <svg
          className={`${iconClass} mx-auto`}
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
        {size !== "tiny" && <p className="text-sm">Image not available</p>}
      </div>
    </div>
  );
}
