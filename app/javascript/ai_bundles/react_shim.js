// Remote-bundle shim: ensure we reuse the host app's React instance (hooks must be shared).
//
// IMPORTANT: `app/javascript/application.jsx` assigns `window.React = React`.
const React = (typeof window !== "undefined" && window.React) || null;

if (!React) {
  throw new Error(
    "window.React is not available. Ensure the host app sets window.React before importing remote bundles."
  );
}

export default React;

// Named exports commonly used by our components (and any future AI-generated ones).
export const {
  Fragment,
  Children,
  cloneElement,
  createContext,
  createElement,
  forwardRef,
  isValidElement,
  lazy,
  memo,
  useCallback,
  useContext,
  useDebugValue,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} = React;


