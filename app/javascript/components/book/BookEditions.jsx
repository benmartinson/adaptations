import React, { useEffect, useState } from "react";
import moment from "moment";
import { useNavigate } from "react-router-dom";

export default function BookEditions({ work_id, initialEditions }) {
  const navigate = useNavigate();
  const [editions, setEditions] = useState(initialEditions);
  const [imageError, setImageError] = useState({});

  useEffect(() => {
    const url = `/api/books/${work_id}/editions`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setEditions(data);
      });
  }, []);
  console.log({ editions });

  return (
    <div>
      <h4 className="font-fancy text-[14px] leading-[20px] font-[600] font-bold mt-6">
        More editions
      </h4>
      <div className="flex flex-start gap-8 mt-3">
        {editions.map((edition) => (
          <div
            key={edition.id}
            className="group"
            onClick={() => {
              if (edition.isbn) {
                navigate(`/books/${edition.isbn}`);
              }
            }}
          >
            {edition.isbn && !imageError[edition.id] && (
              <img
                src={`https://covers.openlibrary.org/b/isbn/${edition.isbn}-L.jpg?default=false`}
                alt={edition.title}
                className="w-[150px] h-[230px] m-auto [border-radius:0_6%_6%_0_/4%] drop-shadow-md group-hover:scale-105 transition-all duration-300"
                onError={() =>
                  setImageError({ ...imageError, [edition.id]: true })
                }
              />
            )}
            {imageError[edition.id] && (
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
              <div className="">{edition.format}</div>
              <div className="line-break  ">{edition.publisher}</div>
              <div className="">
                {moment(edition.publication_date).format("YYYY")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
