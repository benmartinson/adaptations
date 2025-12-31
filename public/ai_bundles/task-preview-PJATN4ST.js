// app/javascript/ai_bundles/iframe_components_shim.js
function createComponentShim(name) {
  return function ShimmedComponent(props) {
    if (typeof window !== "undefined" && window[name]) {
      return window[name](props);
    }
    throw new Error(
      `${name} component is not available. Ensure iframe_components.js is loaded before rendering.`
    );
  };
}
var HorizontalCardList = createComponentShim("HorizontalCardList");
var VerticalCardList = createComponentShim("VerticalCardList");
var DetailPage = createComponentShim("DetailPage");

// app/javascript/ai_bundles/task_preview_1767141743_4409c76d.jsx
function VerticalCardList2({ data }) {
  const { title, items = [], onItemClick } = data || {};
  const { useState } = React;
  const [imageErrors, setImageErrors] = useState({});
  const markImageError = (id) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };
  const filteredItems = items.filter((item) => item.imageUrl || item.image_url);
  return /* @__PURE__ */ React.createElement("div", null, title && /* @__PURE__ */ React.createElement("h4", { className: "font-fancy text-[14px] leading-[20px] font-[600] font-bold mt-6" }, title), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-4 mt-3" }, filteredItems.map((item) => {
    if (imageErrors[item.id]) {
      return null;
    }
    const imgSource = item.imageUrl || item.image_url;
    return /* @__PURE__ */ React.createElement(
      DynamicLink,
      {
        key: item.id,
        systemTag: "BookDetail",
        apiEndpoint: item.api_endpoint_link
      },
      /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "group cursor-pointer",
          onClick: () => onItemClick && onItemClick(item)
        },
        /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-4" }, /* @__PURE__ */ React.createElement(
          "img",
          {
            src: imgSource,
            alt: item.firstLineText || "",
            className: "w-[80px] h-[125px] flex-shrink-0 [border-radius:0_6%_6%_0_/4%] drop-shadow-md group-hover:scale-105 transition-all duration-300",
            onError: () => markImageError(item.id)
          }
        ), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col justify-center flex-1" }, item.firstLineText && /* @__PURE__ */ React.createElement("div", { className: "font-bold text-[14px] leading-[18px] font-body" }, item.firstLineText), item.secondLineText && /* @__PURE__ */ React.createElement("div", { className: "text-[#707070] text-[12px] leading-[16px] font-body mt-1" }, item.secondLineText), item.thirdLineText && /* @__PURE__ */ React.createElement("div", { className: "text-[#707070] text-[12px] leading-[16px] font-body mt-1" }, item.thirdLineText), item.fourthLineText && /* @__PURE__ */ React.createElement("div", { className: "text-[#707070] text-[12px] leading-[16px] font-body mt-1" }, item.fourthLineText)))
      )
    );
  })));
}
export {
  VerticalCardList2 as default
};
