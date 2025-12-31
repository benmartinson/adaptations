export default function VerticalCardList({ data }) {
  // Destructure the data prop
  const { title, items = [], onItemClick } = data || {};

  // Use React from window (loaded via CDN in iframe)
  const { useState } = React;
  const [imageErrors, setImageErrors] = useState({});

  const markImageError = (id) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  // Filter out items that have no image URL (handling both camelCase and snake_case just in case)
  const filteredItems = items.filter(item => item.imageUrl || item.image_url);

  return (
    <div>
      {title && (
        <h4 className="font-fancy text-[14px] leading-[20px] font-[600] font-bold mt-6">
          {title}
        </h4>
      )}
      <div className="flex flex-col gap-4 mt-3">
        {filteredItems.map((item) => {
          // Filter out the entire item if the image URL is broken
          if (imageErrors[item.id]) {
            return null;
          }

          const imgSource = item.imageUrl || item.image_url;

          return (
            <DynamicLink
              key={item.id}
              systemTag="BookDetail"
              apiEndpoint={item.api_endpoint_link}
            >
              <div
                className="group cursor-pointer"
                onClick={() => onItemClick && onItemClick(item)}
              >
                <div className="flex items-start gap-4">
                  <img
                    src={imgSource}
                    alt={item.firstLineText || ""}
                    className="w-[80px] h-[125px] flex-shrink-0 [border-radius:0_6%_6%_0_/4%] drop-shadow-md group-hover:scale-105 transition-all duration-300"
                    onError={() => markImageError(item.id)}
                  />
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
              </div>
            </DynamicLink>
          );
        })}
      </div>
    </div>
  );
}