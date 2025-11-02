import React from "react";
import moment from "moment";

export default function BookEditions({ editions }) {
  return (
    <div>
      <h4 className="font-fancy text-[14px] leading-[20px] font-[600] font-bold mt-6">
        More editions
      </h4>
      <div className="flex flex-start gap-8 mt-3">
        {editions.map((edition) => (
          <div key={edition.id}>
            {edition.image_url && (
              <img
                src={edition.image_url}
                alt={edition.title}
                className="w-[150px] h-[230px] m-auto [border-radius:0_6%_6%_0_/4%] drop-shadow-md"
              />
            )}
            <div className="text-[#707070] text-[14px] leading-[18px] font-body mt-2">
              <div className="">{edition.format.split(",")[1]}</div>
              <div className="">{edition.publisher}</div>
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
