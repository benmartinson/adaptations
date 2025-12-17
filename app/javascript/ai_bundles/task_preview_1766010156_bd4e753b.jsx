import React from "react";
import PropTypes from "prop-types";

/**
 * Helper component for displaying a consistent section title.
 */
const SectionTitle = ({ children }) => (
  <h2 className="text-xl font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">
    {children}
  </h2>
);

/**
 * Helper component for displaying a label-value pair.
 */
const InfoItem = ({ label, value }) => (
  <div className="mb-2">
    <span className="font-medium text-gray-700">{label}: </span>
    <span className="text-gray-600">{value}</span>
  </div>
);

/**
 * AuthorProfileDisplay component visualizes transformed API response data
 * for an author's profile.
 *
 * It expects a 'data' prop which is an object containing pre-transformed
 * and formatted information about the author.
 */
const AuthorProfileDisplay = ({ data }) => {
  // Handle loading state or no data provided
  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg shadow-inner border border-gray-200">
        <p className="text-gray-600 text-lg">Loading author data...</p>
      </div>
    );
  }

  // Destructure data with default empty values to prevent errors if fields are missing.
  // This assumes the 'data' prop is already transformed into this structure.
  const {
    name = "Unknown Author",
    bioHtml = "<p>No biographical information available.</p>",
    birthDate = "N/A",
    links = [],
    remoteIds = [], // Expected: [{ name: 'VIAF', url: '...' }]
    alternateNames = [],
    photoUrls = [], // Expected: ['https://example.com/photo.jpg']
    createdDate = "N/A",
    lastModifiedDate = "N/A",
  } = data;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg border border-gray-200">
      {/* Header Section: Name, Photo, Alternate Names, Birth Date */}
      <div className="flex flex-col md:flex-row items-center md:items-start mb-6 pb-4 border-b border-gray-300">
        {photoUrls.length > 0 && (
          <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
            <img
              src={photoUrls[0]}
              alt={`Photo of ${name}`}
              className="w-32 h-32 object-cover rounded-full border-2 border-gray-300 shadow-md"
            />
          </div>
        )}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 text-center md:text-left mb-2">
            {name}
          </h1>
          {alternateNames.length > 0 && (
            <p className="text-gray-500 text-sm text-center md:text-left">
              Also known as: {alternateNames.join(", ")}
            </p>
          )}
          <InfoItem label="Born" value={birthDate} />
        </div>
      </div>

      {/* Biography Section */}
      <div className="mb-6">
        <SectionTitle>Biography</SectionTitle>
        <div
          // Assuming bioHtml is already sanitized and safe to render.
          // For untrusted content, further sanitization is recommended.
          className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: bioHtml }}
        />
      </div>

      {/* External Links Section */}
      {links.length > 0 && (
        <div className="mb-6">
          <SectionTitle>External Links</SectionTitle>
          <ul className="list-disc list-inside text-gray-700 ml-4">
            {links.map((link, index) => (
              <li key={index} className="mb-1">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {link.title || link.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Identifiers (Remote IDs) Section */}
      {remoteIds.length > 0 && (
        <div className="mb-6">
          <SectionTitle>Identifiers</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
            {remoteIds.map((id, index) => (
              <div key={index}>
                <span className="font-medium text-gray-700">{id.name}: </span>
                <a
                  href={id.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                >
                  {/* Display just the ID part of the URL, or the full URL if it's simple */}
                  {id.url.split("/").pop() || id.url}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata Section: Creation and Last Modified Dates */}
      <div className="pt-4 border-t border-gray-300 text-sm text-gray-500">
        <InfoItem label="Record Created" value={createdDate} />
        <InfoItem label="Last Modified" value={lastModifiedDate} />
      </div>
    </div>
  );
};

AuthorProfileDisplay.propTypes = {
  /**
   * The transformed author data object.
   * Expected to be pre-processed from the raw API response.
   */
  data: PropTypes.shape({
    name: PropTypes.string,
    bioHtml: PropTypes.string, // HTML string for biography
    birthDate: PropTypes.string,
    links: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
        url: PropTypes.string.isRequired,
      })
    ),
    remoteIds: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired, // e.g., "VIAF", "Wikidata"
        url: PropTypes.string.isRequired, // Full URL to the identifier
      })
    ),
    alternateNames: PropTypes.arrayOf(PropTypes.string),
    photoUrls: PropTypes.arrayOf(PropTypes.string), // Array of photo URLs
    createdDate: PropTypes.string,
    lastModifiedDate: PropTypes.string,
  }),
};

AuthorProfileDisplay.defaultProps = {
  data: null, // Default to null to trigger the loading/no data state
};

export default AuthorProfileDisplay;
