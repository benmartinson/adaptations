import React from "react"

const HelloWorld = ({ greeting }) => {
  return (
    <div style={{ fontFamily: "sans-serif", fontSize: "1.25rem" }}>
      👋 {greeting}
    </div>
  )
}

export default HelloWorld;
