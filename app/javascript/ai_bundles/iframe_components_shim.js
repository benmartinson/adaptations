// Remote-bundle shim for iframe components
// These components are loaded globally in the iframe via /iframe_components.js
// This shim allows AI-generated code to use them without explicit imports

// Helper to create a component that checks window at render time (not import time)
function createComponentShim(name) {
  return function ShimmedComponent(props) {
    if (typeof window !== "undefined" && window[name]) {
      // Component is available - use it
      return window[name](props);
    }
    // Component not available - throw error to fail the render
    throw new Error(
      `${name} component is not available. Ensure iframe_components.js is loaded before rendering.`
    );
  };
}

// Components are attached to window by iframe_components.js
export const HorizontalCardList = createComponentShim("HorizontalCardList");
export const VerticalCardList = createComponentShim("VerticalCardList");
export const DetailPage = createComponentShim("DetailPage");

// Default export for any generic imports
export default {
  HorizontalCardList,
  VerticalCardList,
  DetailPage,
};
