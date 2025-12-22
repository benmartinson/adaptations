// app/javascript/ai_bundles/task_preview_1766434302_8f066218.jsx
function HorizontalCardList({ data }) {
  const { title, items, onItemClick } = data || {};
  const { useState } = React;
  const [imageErrors, setImageErrors] = useState({});
  const markImageError = (id) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };
  const hasImageError = (id) => imageErrors[id] === true;
  const validItems = (items || []).filter(
    (item) => item.imageUrl && !hasImageError(item.id)
  );
  return /* @__PURE__ */ React.createElement("div", null, title && /* @__PURE__ */ React.createElement("h4", { className: "text-[14px] leading-[20px] font-semibold mt-6" }, title), /* @__PURE__ */ React.createElement("div", { className: "flex flex-start gap-8 mt-3 overflow-x-auto pb-2" }, validItems.map((item) => /* @__PURE__ */ React.createElement(
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
        onError: () => markImageError(item.id)
      }
    ),
    /* @__PURE__ */ React.createElement("div", { className: "text-[#707070] text-[14px] leading-[18px] mt-2 w-[150px] max-w-[150px]" }, item.firstLineText && /* @__PURE__ */ React.createElement("div", null, item.firstLineText), item.secondLineText && /* @__PURE__ */ React.createElement("div", { className: "line-break" }, item.secondLineText), item.thirdLineText && /* @__PURE__ */ React.createElement("div", null, item.thirdLineText))
  ))));
}
export {
  HorizontalCardList as default
};
