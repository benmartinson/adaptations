export default function HorizontalCardList({ data }) {
  // Destructure the data prop
  const { title, items, onItemClick } = data || {};

  // Use React from window (loaded via CDN in iframe)
  const { useState } = React;
  const [brokenImages, setBrokenImages] = useState({});

  const handleImageError = (id) => {
    setBrokenImages((prev) => ({ ...prev, [id]: true }));
  };

  // Filter out items that have no imageUrl or have encountered a loading error
  const visibleItems = (items || []).filter(
    (item) => item.imageUrl && !brokenImages[item.id]
  );

  if (visibleItems.length === 0 && (!items || items.length > 0)) {
    return null;
  }

  // Transform the title to replace "Works by" with "Books by" as requested
  const displayTitle = title ? title.replace(/Works by/g, "Books by") : title;

  return (
    <div className="w-full">
      {displayTitle && visibleItems.length > 0 && (
        <h4 className="text-[14px] leading-[20px] font-bold mt-6 px-6">
          {displayTitle}
        </h4>
      )}
      <div className="flex flex-start gap-8 mt-3 overflow-x-auto pb-4 px-6 no-scrollbar">
        {visibleItems.map((item) => (
          <div
            key={item.id}
            className="group flex-shrink-0 cursor-pointer"
            onClick={() => onItemClick && onItemClick(item)}
          >
            <img
              src={item.imageUrl}
              alt={item.firstLineText || ""}
              className="w-[150px] h-[230px] m-auto [border-radius:0_6%_6%_0_/4%] drop-shadow-md group-hover:scale-105 transition-all duration-300 object-cover"
              onError={() => handleImageError(item.id)}
            />
            <div className="text-[#707070] text-[14px] leading-[18px] mt-2 w-[150px] max-w-[150px]">
              {item.firstLineText && (
                <div className="truncate font-medium text-black">
                  {item.firstLineText}
                </div>
              )}
              {item.secondLineText && (
                <div className="line-break truncate">{item.secondLineText}</div>
              )}
              {item.thirdLineText && (
                <div className="truncate">{item.thirdLineText}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}