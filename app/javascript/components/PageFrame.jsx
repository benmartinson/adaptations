import React from "react";

export default function PageFrame({ children }) {
  return (
    <div className="mx-auto grid grid-cols-12 gap-6 mb-10 max-w-[1260px] min-w-[320px] w-[87.5%] items-start mt-10">
      {children}
    </div>
  );
}
