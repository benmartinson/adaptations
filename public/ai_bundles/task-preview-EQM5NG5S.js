// app/javascript/ai_bundles/task_preview_1766431247_e0f03085.jsx
function AuthorWorks({ data }) {
  return /* @__PURE__ */ React.createElement(
    HorizontalCardList,
    {
      title: `Author Works (${data.size || 0})`,
      items: (data.entries || []).map((entry) => ({
        id: entry.key,
        imageUrl: entry.covers && entry.covers[0] > 0 ? `https://covers.openlibrary.org/b/id/${entry.covers[0]}-M.jpg` : null,
        firstLineText: entry.title,
        secondLineText: entry.subjects ? entry.subjects.slice(0, 2).join(", ") : typeof entry.description === "string" ? entry.description : entry.description?.value || "",
        thirdLineText: entry.created?.value ? entry.created.value.split("-")[0] : entry.subject_places ? entry.subject_places[0] : ""
      }))
    }
  );
}
export {
  AuthorWorks as default
};
