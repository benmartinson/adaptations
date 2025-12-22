export default function AuthorWorks({ data }) {
  return (
    <HorizontalCardList
      title={`Author Works (${data.size || 0})`}
      items={(data.entries || []).map((entry) => ({
        id: entry.key,
        imageUrl: entry.covers && entry.covers[0] > 0 
          ? `https://covers.openlibrary.org/b/id/${entry.covers[0]}-M.jpg` 
          : null,
        firstLineText: entry.title,
        secondLineText: entry.subjects 
          ? entry.subjects.slice(0, 2).join(", ") 
          : (typeof entry.description === 'string' ? entry.description : entry.description?.value || ""),
        thirdLineText: entry.created?.value 
          ? entry.created.value.split('-')[0] 
          : (entry.subject_places ? entry.subject_places[0] : "")
      }))}
    />
  );
}