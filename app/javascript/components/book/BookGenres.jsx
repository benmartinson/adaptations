import React from "react";

export default function BookGenres({ genres }) {
  return (
    <div className="inline-flex gap-3 mt-6 p-3 pl-0 items-center">
      <div className="text-gray-500 text-[14px] leading-[18px] font-light">
        Genres
      </div>
      {genres.map((genre) => (
        <div
          key={genre.id}
          className="font-bold border-b-2 border-[#409970] ml-1"
        >
          {genre.name}
        </div>
      ))}
    </div>
  );
}
