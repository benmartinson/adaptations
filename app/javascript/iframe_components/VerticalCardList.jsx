export default function VerticalCardList({
  data,
  title: directTitle,
  items: directItems,
  onItemClick: directOnItemClick,
}) {
  // Support both direct props and data wrapper for flexibility
  const title = directTitle ?? data?.title;
  const items = directItems ?? data?.items ?? [];
  const onItemClick = directOnItemClick ?? data?.onItemClick;

  const { useState } = React;
  const [imageErrors, setImageErrors] = useState({});

  const markImageError = (id) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  const hasImageError = (id) => imageErrors[id] === true;

  const ImageNotFound = ({ size = "small" }) => {
    const sizeClasses = {
      tiny: "w-[80px] h-[120px]",
      small: "w-[150px] h-[230px]",
      large: "w-[210px] h-[320px]",
    };
    const sizeClass = sizeClasses[size] || sizeClasses.small;
    const iconClass = size === "tiny" ? "w-8 h-8" : "w-16 h-16 mb-2";

    return (
      <div
        className={`${sizeClass} m-auto [border-radius:0_6%_6%_0_/4%] drop-shadow-md bg-gray-200 flex items-center justify-center border-2 border-dashed border-gray-400`}
      >
        <div className="text-center text-gray-500">
          <svg
            className={`${iconClass} mx-auto`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {size !== "tiny" && <p className="text-sm">Image not available</p>}
        </div>
      </div>
    );
  };

  return (
    <div>
      {title && (
        <h4 className="font-fancy text-[14px] leading-[20px] font-[600] font-bold mt-6">
          {title}
        </h4>
      )}
      <div className="flex flex-col gap-4 mt-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="group flex items-start gap-4 cursor-pointer"
            onClick={() => onItemClick && onItemClick(item)}
          >
            {item.imageUrl && !hasImageError(item.id) && (
              <img
                src={item.imageUrl}
                alt={item.firstLineText || ""}
                className="w-[80px] h-[125px] flex-shrink-0 [border-radius:0_6%_6%_0_/4%] drop-shadow-md group-hover:scale-105 transition-all duration-300"
                onError={() => markImageError(item.id)}
              />
            )}
            {hasImageError(item.id) && (
              <div className="flex-shrink-0">
                <ImageNotFound size="tiny" />
              </div>
            )}
            <div className="flex flex-col justify-center flex-1">
              {item.firstLineText && (
                <div className="font-bold text-[14px] leading-[18px] font-body">
                  {item.firstLineText}
                </div>
              )}
              {item.secondLineText && (
                <div className="text-[#707070] text-[12px] leading-[16px] font-body mt-1">
                  {item.secondLineText}
                </div>
              )}
              {item.thirdLineText && (
                <div className="text-[#707070] text-[12px] leading-[16px] font-body mt-1">
                  {item.thirdLineText}
                </div>
              )}
              {item.fourthLineText && (
                <div className="text-[#707070] text-[12px] leading-[16px] font-body mt-1">
                  {item.fourthLineText}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
