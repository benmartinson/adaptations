import React from "react"
import { createRoot } from "react-dom/client"
import HelloWorld from "./components/HelloWorld" 

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("react-root")
  if (container) {
    const root = createRoot(container)
    root.render(<HelloWorld greeting="Hello from React inside Rails!" />)
  }
})
