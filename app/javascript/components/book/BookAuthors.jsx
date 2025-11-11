import React from "react";
import { useNavigate } from "react-router-dom";

export default function BookAuthors({ authors, contributors }) {
  const navigate = useNavigate();
  // Combine both arrays to handle commas properly across all authors
  const allAuthors = [
    ...authors.map((author) => ({ type: "author", data: author })),
    ...contributors.map((contributor) => ({
      type: "contributor",
      data: contributor,
    })),
  ];

  console.log({ allAuthors });
  return (
    <div className="font-fancy inline-flex gap-2 text-[20px] leading-[28px] font-light text-[#1e1915] mt-0.5">
      {allAuthors.map((item, index) => {
        const isLast = index === allAuthors.length - 1;
        return (
          <span key={index} className="">
            {item.type === "author" ? (
              <span
                className="cursor-pointer underline"
                onClick={() => navigate(`/author/${item.data.slug}`)}
              >
                {item.data.full_name}
              </span>
            ) : (
              <>
                {item.data.name}{" "}
                <span className="text-[#707070]">({item.data.role})</span>
              </>
            )}
            {!isLast && <span>, </span>}
          </span>
        );
      })}
    </div>
  );
}
