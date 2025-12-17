import React from 'react';
import PropTypes from 'prop-types';

/**
 * A simple helper component to render a titled section of content.
 * It ensures that sections with no children are not rendered.
 */
const Section = ({ title, children }) => {
  // Don't render the section if there's no content
  if (!children || (Array.isArray(children) && children.length === 0)) {
    return null;
  }

  return (
    <div className="mb-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-2 border-b border-gray-300 pb-1">
        {title}
      </h3>
      <div className="text-gray-700 leading-relaxed">
        {children}
      </div>
    </div>
  );
};

Section.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node, // Can be any renderable React child
};

/**
 * AuthorProfile component visualizes author data from an API response.
 * It expects a pre-transformed 'data' prop and handles loading and error states.
 */
const AuthorProfile = ({ data }) => {
  // Handle loading state: if data is null or undefined
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="text-2xl font-medium text-gray-600">Loading author data...</div>
      </div>
    );
  }

  // Handle error state: if the data object contains an 'error' property
  if (data.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="text-2xl font-medium text-red-600">Error: {data.error}</div>
      </div>
    );
  }

  // Destructure relevant data from the prop for easier access
  const {
    name,
    bio,
    links,
    birthDate,
    alternateNames,
    remoteIds, // e.g., { viaf: "...", wikidata: "..." }
    photoUrl,  // Optional URL for an author's photo
  } = data;

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 flex items-center justify-center">
      <div className="max-w-4xl w-full bg-white shadow-xl rounded-lg p-6 sm:p-8 md:p-10 border border-gray-200">
        {/* Header Section: Name, Photo, Birth Date */}
        <header className="text-center mb-8 pb-4 border-b border-gray-300">
          {photoUrl && (
            <img
              src={photoUrl}
              alt={`${name}'s profile`}
              className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-gray-300 shadow-md"
            />
          )}
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{name || 'Unknown Author'}</h1>
          {birthDate && (
            <p className="text-lg text-gray-600">Born: {birthDate}</p>
          )}
        </header>

        {/* Biography Section */}
        {bio && (
          <Section title="Biography">
            <p>{bio}</p>
          </Section>
        )}

        {/* Alternate Names Section */}
        {alternateNames && alternateNames.length > 0 && (
          <Section title="Alternate Names">
            <ul className="list-disc list-inside space-y-1">
              {alternateNames.map((altName, index) => (
                <li key={index} className="text-gray-700">{altName}</li>
              ))}
            </ul>
          </Section>
        )}

        {/* External Links Section */}
        {links && links.length > 0 && (
          <Section title="External Links">
            <ul className="space-y-2">
              {links.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
                  >
                    {link.title || link.url}
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Remote Identifiers Section */}
        {remoteIds && Object.keys(remoteIds).length > 0 && (
          <Section title="Identifiers">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(remoteIds).map(([key, value]) => (
                <div key={key} className="bg-gray-50 p-3 rounded-md border border-gray-200">
                  <span className="font-medium text-gray-800 capitalize">{key.replace(/_/g, ' ')}: </span>
                  <span className="text-gray-700 break-words">{value}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Fallback message if no meaningful data is present after initial checks */}
        {!name && !bio && !links && !birthDate && !alternateNames && !remoteIds && (
          <div className="text-center text-gray-500 text-lg py-8">
            No detailed information available for this author.
          </div>
        )}
      </div>
    </div>
  );
};

// PropTypes for validation of the 'data' prop
AuthorProfile.propTypes = {
  data: PropTypes.shape({
    name: PropTypes.string,
    bio: PropTypes.string, // Assuming bio is transformed to a plain string
    links: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
        url: PropTypes.string.isRequired,
      })
    ),
    birthDate: PropTypes.string,
    alternateNames: PropTypes.arrayOf(PropTypes.string),
    remoteIds: PropTypes.objectOf(PropTypes.string), // Object where keys and values are strings
    photoUrl: PropTypes.string, // Optional URL for the author's photo
    error: PropTypes.string, // Optional error message for error handling
  }),
};

// Export the main component as the default export
export default AuthorProfile;