export default function HorizontalCardList({ data }) {
  // Destructure the data prop
  const { title, items, onItemClick } = data || {};

  // Use React from window (loaded via CDN in iframe)
  const { useState } = React;
  const [imageErrors, setImageErrors] = useState({});

  const markImageError = (id) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  const hasImageError = (id) => imageErrors[id] === true;

  // Filter items to only show those that haven't failed to load
  // We also check if imageUrl exists to ensure we only show items with images
  const validItems = (items || []).filter(
    (item) => item.imageUrl && !hasImageError(item.id)
  );

  return (
    <div>
      {title && (
        <h4 className="text-[14px] leading-[20px] font-semibold mt-6">
          {title}
        </h4>
      )}
      <div className="flex flex-start gap-8 mt-3 overflow-x-auto pb-2">
        {validItems.map((item) => (
          <div
            key={item.id}
            className="group flex-shrink-0 cursor-pointer"
            onClick={() => onItemClick && onItemClick(item)}
          >
            <img
              src={item.imageUrl}
              alt={item.firstLineText || ""}
              className="w-[150px] h-[230px] m-auto [border-radius:0_6%_6%_0_/4%] drop-shadow-md group-hover:scale-105 transition-all duration-300 object-cover"
              onError={() => markImageError(item.id)}
            />
            <div className="text-[#707070] text-[14px] leading-[18px] mt-2 w-[150px] max-w-[150px]">
              {item.firstLineText && <div>{item.firstLineText}</div>}
              {item.secondLineText && (
                <div className="line-break">{item.secondLineText}</div>
              )}
              {item.thirdLineText && <div>{item.thirdLineText}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}