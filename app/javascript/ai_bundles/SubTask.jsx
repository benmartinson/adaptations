// SubTask shim - this references the global SubTask component 
// that is defined at runtime inside the iframe (see DynamicUIFile.jsx)
// This allows AI-generated components to use standard import syntax.

const SubTask = typeof window !== 'undefined' && window.SubTask 
  ? window.SubTask 
  : (props) => {
      // Fallback for server-side or non-iframe contexts
      return null;
    };

export default SubTask;

