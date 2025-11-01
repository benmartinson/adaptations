import React, { useEffect, useState } from "react";

export default function BookAuthors({ authors }) {
  return (
    <div className="font-fancy inline-flex gap-2 text-[20px] leading-[28px] font-light text-[#1e1915] mt-0.5">
      {authors.map((author) => {
        return <span className="">{author.full_name} </span>;
      })}
    </div>
  );
}
