import React from "react";
import { Link } from "react-router-dom";

const links = [
  { to: "/books", label: "Books" },
  { to: "/author/patrick-rothfuss", label: "Authors" },
  { to: "/try_api", label: "Try API" },
];

export default function Navbar() {
  return (
    <nav className="w-full bg-[#faf8f6] sticky top-0 z-10 shadow-sm">
      <div className="max-w-[1260px] mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/books" className="text-xl font-semibold font-fancy">
          API Visualizer
        </Link>
        <div className="flex items-center gap-4 text-sm font-medium text-gray-600">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="hover:text-gray-900 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
