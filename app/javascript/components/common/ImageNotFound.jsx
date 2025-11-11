import React from "react";

export default function ImageNotFound() {
  return (
    <div className="w-[210px] h-[320px] m-auto [border-radius:0_6%_6%_0_/4%] drop-shadow-md bg-gray-200 flex items-center justify-center border-2 border-dashed border-gray-400">
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
  );
}
