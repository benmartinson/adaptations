import React from "react";
export default function Label({ label, value }) {
  return (
    <div className="flex text-[14px] leading-[18px] font-body mt-2 text-[#707070] ">
      <p className="w-[125px] mr-2">{label}</p>
      <p className="">{value}</p>
    </div>
  );
}
