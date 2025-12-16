// app/javascript/ai_bundles/react_shim.js
var React = typeof window !== "undefined" && window.React || null;
if (!React) {
  throw new Error(
    "window.React is not available. Ensure the host app sets window.React before importing remote bundles."
  );
}
var react_shim_default = React;
var {
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
  useTransition
} = React;

// app/javascript/components/PageFrame.jsx
function PageFrame({ children }) {
  return /* @__PURE__ */ react_shim_default.createElement("div", { className: "mx-auto grid grid-cols-12 gap-6 mb-10 max-w-[1260px] min-w-[320px] w-[87.5%] items-start mt-10" }, children);
}

// app/javascript/components/common/Label.jsx
function Label({ label, value }) {
  return /* @__PURE__ */ react_shim_default.createElement("div", { className: "flex text-[14px] leading-[18px] font-body mt-2 text-[#707070] " }, /* @__PURE__ */ react_shim_default.createElement("p", { className: "w-[125px] mr-2" }, label), /* @__PURE__ */ react_shim_default.createElement("p", { className: "" }, value));
}

// app/javascript/components/common/ImageNotFound.jsx
function ImageNotFound({ size = "large" }) {
  const sizeClasses = {
    tiny: "w-[80px] h-[120px]",
    small: "w-[150px] h-[230px]",
    large: "w-[210px] h-[320px]"
  };
  const sizeClass = sizeClasses[size] || sizeClasses.large;
  const iconClasses = {
    tiny: "w-8 h-8",
    small: "w-16 h-16 mb-2",
    large: "w-16 h-16 mb-2"
  };
  const iconClass = iconClasses[size] || iconClasses.large;
  return /* @__PURE__ */ react_shim_default.createElement(
    "div",
    {
      className: `${sizeClass} m-auto [border-radius:0_6%_6%_0_/4%] drop-shadow-md bg-gray-200 flex items-center justify-center border-2 border-dashed border-gray-400`
    },
    /* @__PURE__ */ react_shim_default.createElement("div", { className: "text-center text-gray-500" }, /* @__PURE__ */ react_shim_default.createElement(
      "svg",
      {
        className: `${iconClass} mx-auto`,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        xmlns: "http://www.w3.org/2000/svg"
      },
      /* @__PURE__ */ react_shim_default.createElement(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeWidth: 2,
          d: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        }
      )
    ), size !== "tiny" && /* @__PURE__ */ react_shim_default.createElement("p", { className: "text-sm" }, "Image not available"))
  );
}

// app/javascript/components/task/Preview/PreviewItem.jsx
function PreviewItem({ item, isNested = false }) {
  const {
    header,
    subheader,
    image_url,
    attributes,
    list_items,
    list_items_header
  } = item;
  const [imageError, setImageError] = useState(false);
  const descriptionKeys = ["description", "summary", "overview", "plot"];
  let description = "";
  const otherAttributes = {};
  if (attributes && typeof attributes === "object") {
    Object.entries(attributes).forEach(([key, value]) => {
      if (descriptionKeys.includes(key.toLowerCase()) && typeof value === "string") {
        if (!description) description = value;
      } else {
        otherAttributes[key] = value;
      }
    });
  }
  const imageClass = isNested ? "w-[80px] h-[120px] m-auto [border-radius:0_6%_6%_0_/4%] drop-shadow-md transition-all duration-300" : "w-[150px] h-[230px] m-auto [border-radius:0_6%_6%_0_/4%] drop-shadow-md group-hover:scale-105 transition-all duration-300";
  const headerClass = isNested ? "font-fancy text-[24px] leading-[32px] font-[600]" : "font-fancy text-[36px] leading-[46px] font-[600]";
  const subheaderClass = isNested ? "font-fancy italic text-[16px] leading-[22px] text-[#707070] mb-1" : "font-fancy italic text-[20px] leading-[28px] text-[#707070] mb-2";
  const Wrapper = isNested ? "div" : PageFrame;
  const wrapperProps = isNested ? { className: "grid grid-cols-12 gap-4 items-start" } : {};
  return /* @__PURE__ */ react_shim_default.createElement(Wrapper, { ...wrapperProps }, /* @__PURE__ */ react_shim_default.createElement(
    "div",
    {
      className: `${isNested ? "col-span-2" : "col-span-3"} self-start ${isNested ? "" : "sticky top-20"}`
    },
    image_url && !imageError ? /* @__PURE__ */ react_shim_default.createElement(
      "img",
      {
        src: image_url,
        alt: header || "Item image",
        className: imageClass,
        onError: () => setImageError(true)
      }
    ) : /* @__PURE__ */ react_shim_default.createElement(ImageNotFound, { size: isNested ? "tiny" : "small" })
  ), /* @__PURE__ */ react_shim_default.createElement("div", { className: isNested ? "col-span-10" : "col-span-9" }, /* @__PURE__ */ react_shim_default.createElement("h1", { className: headerClass }, header || "Untitled"), subheader && /* @__PURE__ */ react_shim_default.createElement("div", { className: subheaderClass }, subheader), /* @__PURE__ */ react_shim_default.createElement("div", { className: "font-body mt-3" }, description && /* @__PURE__ */ react_shim_default.createElement("div", { className: "mb-6" }, /* @__PURE__ */ react_shim_default.createElement("p", { className: "whitespace-pre-wrap" }, description)), Object.keys(otherAttributes).length > 0 && /* @__PURE__ */ react_shim_default.createElement("div", { className: "mt-3" }, Object.entries(otherAttributes).map(([key, value]) => /* @__PURE__ */ react_shim_default.createElement(
    Label,
    {
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
      value: String(value)
    }
  )))), list_items && Array.isArray(list_items) && list_items.length > 0 && /* @__PURE__ */ react_shim_default.createElement("div", { className: isNested ? "mt-4" : "mt-6" }, /* @__PURE__ */ react_shim_default.createElement(
    "h4",
    {
      className: `font-fancy font-[600] font-bold border-b border-gray-200 pb-2 mb-3 ${isNested ? "text-[12px] leading-[16px]" : "text-[14px] leading-[20px]"}`
    },
    list_items_header ? list_items_header : "Related Items"
  ), /* @__PURE__ */ react_shim_default.createElement(PreviewList, { items: list_items, isNested: true }))));
}

// app/javascript/components/task/Preview/PreviewList.jsx
function PreviewList({
  toResponseText,
  items: directItems,
  isNested = false
}) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (directItems) {
      if (Array.isArray(directItems)) {
        setItems(directItems);
        setError(null);
      } else {
        setError("Direct items is not an array");
      }
      return;
    }
    if (!toResponseText) {
      setItems([]);
      return;
    }
    try {
      let data;
      try {
        data = JSON.parse(toResponseText);
      } catch (e) {
        if (typeof toResponseText === "object") {
          data = toResponseText;
        } else {
          throw e;
        }
      }
      if (Array.isArray(data)) {
        setItems(data);
        setError(null);
      } else if (data && typeof data === "object") {
        const possibleList = data.items || data.data || data.results;
        if (Array.isArray(possibleList)) {
          setItems(possibleList);
          setError(null);
        } else {
          setItems([data]);
          setError(null);
        }
      } else {
        setError("Parsed data is not a list or object");
      }
    } catch (e) {
      setError("Invalid JSON format");
    }
  }, [toResponseText, directItems]);
  if (error) {
    return /* @__PURE__ */ react_shim_default.createElement("div", { className: "max-w-[1260px] mx-auto w-[87.5%] mt-10" }, /* @__PURE__ */ react_shim_default.createElement("div", { className: "p-4 bg-red-50 border border-red-200 rounded-md text-red-600" }, /* @__PURE__ */ react_shim_default.createElement("p", { className: "font-bold" }, "Preview Error"), /* @__PURE__ */ react_shim_default.createElement("p", null, error)));
  }
  if (!items.length && (toResponseText || directItems)) {
    return /* @__PURE__ */ react_shim_default.createElement("div", { className: "max-w-[1260px] mx-auto w-[87.5%] mt-10 text-center text-gray-500" }, "No items found in response.");
  }
  if (!toResponseText && !directItems) {
    return /* @__PURE__ */ react_shim_default.createElement("div", { className: "max-w-[1260px] mx-auto w-[87.5%] mt-10 text-center text-gray-500" }, "Waiting for response data...");
  }
  return /* @__PURE__ */ react_shim_default.createElement("div", { className: isNested ? "space-y-6" : "space-y-12 pb-20" }, items.map((item, index) => /* @__PURE__ */ react_shim_default.createElement("div", { key: index }, /* @__PURE__ */ react_shim_default.createElement(PreviewItem, { item, isNested }), index < items.length - 1 && /* @__PURE__ */ react_shim_default.createElement(
    "div",
    {
      className: `w-full border-b border-gray-200 ${isNested ? "my-6" : "my-12"}`
    }
  ))));
}
export {
  PreviewList as default
};
