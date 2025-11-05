import React from "react";
import moment from "moment";
import { useNavigate } from "react-router-dom";

export default function MoviesBasedOn({ movies }) {
  const navigate = useNavigate();
  return (
    <div>
      <h4 className="font-fancy text-[14px] leading-[20px] font-[600] font-bold mt-6">
        Movies Based On This Book
      </h4>
      <div className="flex flex-start gap-8 mt-3">
        {movies.map((movie) => (
          <div
            key={movie.id}
            className="group"
            onClick={() => navigate(`/movies/${movie.id}`)}
          >
            {movie.image_url && (
              <img
                src={movie.image_url}
                alt={movie.title}
                className="w-[150px] h-[230px] m-auto [border-radius:0_6%_6%_0_/4%] drop-shadow-md group-hover:scale-105 transition-all duration-300"
              />
            )}
            <div className="text-[#707070] text-[14px] leading-[18px] font-body mt-2 w-[150px] max-w-[150px]">
              <div className="">{movie.title}</div>
              <div className="line-break">
                {moment(movie.release_date).format("YYYY")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
