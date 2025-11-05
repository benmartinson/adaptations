import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="w-full bg-[#faf8f6] sticky top-0 z-10 h-[40px] shadow-sm flex items-center justify-start">
      <div className="max-w-[1260px] px-4 py-4">
        <Link to="/books" className="text-xl font-semibold font-fancy">
          Open Library Visualizer
        </Link>
      </div>
    </nav>
  );
}
