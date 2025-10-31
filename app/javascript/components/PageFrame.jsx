import React from "react";

export default function PageFrame({ children }) {
  return (
    <div className="mx-auto max-w-[1260px] relative min-w-[320px] w-[87.5%] mt-40">
      {children}
    </div>
  );
}
