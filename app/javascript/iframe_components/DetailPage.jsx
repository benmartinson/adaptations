// Iframe-compatible component - uses global React from window
// This component displays a detail view for an item, styled like the Book page

export default function DetailPage({ data }) {
  const {
    title,
    sub_title,
    imageUrl,
    description,
    detail_section_header = "Details",
    details = [],
  } = data || {};

  const { useState } = React;
  const [imageError, setImageError] = useState(false);

  // Inline ImageNotFound component
  const ImageNotFound = () => (
    <div className="w-[210px] h-[320px] m-auto [border-radius:0_6%_6%_0_/4%] drop-shadow-md bg-gray-200 flex items-center justify-center border-2 border-dashed border-gray-400">
      <div className="text-center text-gray-500">
        <svg
          className="w-16 h-16 mb-2 mx-auto"
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
        <p className="text-sm px-4">Image not available</p>
      </div>
    </div>
  );

  // Inline Label component
  const DetailLabel = ({ label, value }) => {
    if (!value) return null;
    return (
      <div className="flex text-[14px] leading-[18px] font-body mt-2 text-[#707070]">
        <p className="w-[125px] mr-2">{label}</p>
        <p className="flex-1">{value}</p>
      </div>
    );
  };

  return (
    <div className="mx-auto grid grid-cols-12 gap-6 mb-10 max-w-[1260px] min-w-[320px] w-full items-start mt-10">
      {/* Left Column: Image */}
      <div className="col-span-3 self-start sticky top-20">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-[210px] h-[320px] m-auto [border-radius:0_6%_6%_0_/4%] drop-shadow-md object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <ImageNotFound />
        )}
      </div>

      {/* Right Column: Content */}
      <div className="col-span-9">
        {sub_title && (
          <div className="font-fancy italic text-[20px] leading-[28px] text-[#707070] mb-2">
            {sub_title}
          </div>
        )}
        <h1 className="font-fancy text-[36px] leading-[46px] font-[600]">
          {title}
        </h1>

        <div className="font-body grid grid-cols-9 gap-6 mt-3 max-h-[200px] overflow-y-auto">
          <div className="col-span-7">
            <p className="whitespace-pre-wrap text-[16px] leading-[24px]">
              {description}
            </p>
          </div>
        </div>

        {detail_section_header && details && details.length > 0 && (
          <>
            <h4 className="font-fancy text-[14px] leading-[20px] font-bold mt-6">
              {detail_section_header}
            </h4>
            <div className="mt-3">
              {details.map((detail, index) => (
                <DetailLabel
                  key={index}
                  label={detail.label}
                  value={detail.value}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

