import React, { useEffect, useState } from "react";

export default function BookAuthors({
  authors
}) {
  return (
    <div>
      {authors.map((author) => {
        return (
          <span className="">{author.full_name} </span>
        )
      })}
    </div>
  );
}
