import fs from "fs";
import path from "path";
import vm from "vm";
import { JSDOM } from "jsdom";
import React from "react";
import { renderToString } from "react-dom/server";

const WORKSPACE_PATH = "/workspace";

// Set up minimal DOM environment for components that might access window/document
const dom = new JSDOM(
  '<!DOCTYPE html><html><body><div id="root"></div></body></html>',
  {
    url: "http://localhost",
    pretendToBeVisual: true,
  }
);

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// IMPORTANT: Set up React globally for components that access React directly
// (like iframe_components that use `const { useState } = React`)
global.React = React;

// Also set up window.React for the react_shim used in bundled components
global.window.React = React;

// Load iframe components (HorizontalCardList, VerticalCardList, etc.)
// These are attached to window.* by the iframe_components.js script
function loadIframeComponents() {
  const iframeComponentsPath = path.join(
    WORKSPACE_PATH,
    "iframe_components.js"
  );
  if (fs.existsSync(iframeComponentsPath)) {
    try {
      const iframeComponentsCode = fs.readFileSync(
        iframeComponentsPath,
        "utf8"
      );
      // Create a context with React available for the IIFE's `typeof React` check
      const context = {
        React,
        window: global.window,
        console,
      };
      vm.createContext(context);
      vm.runInContext(iframeComponentsCode, context);
    } catch (e) {
      console.error("Failed to load iframe_components.js:", e.message);
    }
  }
}

loadIframeComponents();

// Helper to write output
function writeResult(result) {
  const outDir = path.join(WORKSPACE_PATH, "out");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "result.json"),
    JSON.stringify(result, null, 2)
  );
}

// Helper to write error
function writeError(error) {
  const outDir = path.join(WORKSPACE_PATH, "out");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "error.txt"), error);
}

async function main() {
  try {
    // Read input files
    const bundlePath = path.join(WORKSPACE_PATH, "component.js");
    const dataPath = path.join(WORKSPACE_PATH, "data.json");

    if (!fs.existsSync(bundlePath)) {
      writeResult({ success: false, error: "Component bundle not found" });
      return;
    }

    if (!fs.existsSync(dataPath)) {
      writeResult({ success: false, error: "Data file not found" });
      return;
    }

    const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

    // Dynamically import the bundled component
    // The bundle uses react_shim which expects window.React (set up above)
    const componentUrl = `file://${bundlePath}`;

    let Component;
    try {
      const module = await import(componentUrl);
      Component = module.default;

      if (!Component) {
        writeResult({
          success: false,
          error: "Component bundle has no default export",
        });
        return;
      }
    } catch (importError) {
      writeResult({
        success: false,
        error: `Failed to import component: ${importError.message}`,
        errorType: "import",
      });
      return;
    }

    // Create an ErrorBoundary for catching render errors
    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { error: null };
      }

      static getDerivedStateFromError(error) {
        return { error };
      }

      componentDidCatch(error, errorInfo) {
        // Error is already captured in state
      }

      render() {
        if (this.state.error) {
          // Signal error by throwing during render
          throw this.state.error;
        }
        return this.props.children;
      }
    }

    // Try to render the component
    try {
      const element = React.createElement(
        ErrorBoundary,
        null,
        React.createElement(Component, { data })
      );

      const html = renderToString(element);

      // Check if render produced an error element
      if (html.includes('class="error"') && html.includes("Component Error:")) {
        writeResult({
          success: false,
          error: "Component rendered an error state",
          errorType: "render",
          html: html.substring(0, 500), // Include first 500 chars for debugging
        });
        return;
      }

      writeResult({
        success: true,
        html: html.substring(0, 1000), // Include first 1000 chars of rendered HTML
        htmlLength: html.length,
      });
    } catch (renderError) {
      writeResult({
        success: false,
        error: `Render error: ${renderError.message}`,
        errorType: "render",
        stack: renderError.stack?.split("\n").slice(0, 5).join("\n"),
      });
    }
  } catch (error) {
    writeResult({
      success: false,
      error: `Unexpected error: ${error.message}`,
      errorType: "unexpected",
      stack: error.stack?.split("\n").slice(0, 5).join("\n"),
    });
  }
}

main().catch((error) => {
  writeError(`Fatal error: ${error.message}\n${error.stack}`);
  process.exit(1);
});
