import React, { useEffect, useState } from "react";
import PreviewList from "./PreviewList";

export default function PreviewPage() {
  const [toResponseText, setToResponseText] = useState("");

  useEffect(() => {
    const storedData = localStorage.getItem("previewData");
    if (storedData) {
      setToResponseText(storedData);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="py-8 px-4">
        <div className="max-w-[1260px] mx-auto w-[87.5%] mb-8"></div>
        <PreviewList toResponseText={toResponseText} />
      </div>
    </div>
  );
}
