// app/javascript/ai_bundles/task_preview_1766434585_96b12a06.jsx
function HorizontalCardList({ data }) {
  const { title, items, onItemClick } = data || {};
  const { useState } = React;
  const [brokenImages, setBrokenImages] = useState({});
  const handleImageError = (id) => {
    setBrokenImages((prev) => ({ ...prev, [id]: true }));
  };
  const visibleItems = (items || []).filter(
    (item) => item.imageUrl && !brokenImages[item.id]
  );
  if (visibleItems.length === 0 && (!items || items.length > 0)) {
    return null;
  }
  const displayTitle = title ? title.replace(/Works by/g, "Books by") : title;
  return /* @__PURE__ */ React.createElement("div", { className: "w-full" }, displayTitle && visibleItems.length > 0 && /* @__PURE__ */ React.createElement("h4", { className: "text-[14px] leading-[20px] font-bold mt-6 px-6" }, displayTitle), /* @__PURE__ */ React.createElement("div", { className: "flex flex-start gap-8 mt-3 overflow-x-auto pb-4 px-6 no-scrollbar" }, visibleItems.map((item) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: item.id,
      className: "group flex-shrink-0 cursor-pointer",
      onClick: () => onItemClick && onItemClick(item)
    },
    /* @__PURE__ */ React.createElement(
      "img",
      {
        src: item.imageUrl,
        alt: item.firstLineText || "",
        className: "w-[150px] h-[230px] m-auto [border-radius:0_6%_6%_0_/4%] drop-shadow-md group-hover:scale-105 transition-all duration-300 object-cover",
        onError: () => handleImageError(item.id)
      }
    ),
    /* @__PURE__ */ React.createElement("div", { className: "text-[#707070] text-[14px] leading-[18px] mt-2 w-[150px] max-w-[150px]" }, item.firstLineText && /* @__PURE__ */ React.createElement("div", { className: "truncate font-medium text-black" }, item.firstLineText), item.secondLineText && /* @__PURE__ */ React.createElement("div", { className: "line-break truncate" }, item.secondLineText), item.thirdLineText && /* @__PURE__ */ React.createElement("div", { className: "truncate" }, item.thirdLineText))
  ))));
}
export {
  HorizontalCardList as default
};
