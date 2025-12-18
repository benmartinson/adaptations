import React from 'react';
import PropTypes from 'prop-types';

const AuthorProfile = ({ data }) => {
  if (!data) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen flex items-center justify-center text-gray-700 text-lg">
        <p>No author data available to display.</p>
      </div>
    );
  }

  // Destructure relevant data, assuming it's already transformed and ready for display.
  const {
    name,
    bio,
    birth_date,
    alternate_names,
    links,
    remote_ids,
    photos,
  } = data;

  // Helper to render a section only if its content exists
  const Section = ({ title, children }) => {
    if (!children || (Array.isArray(children) && children.length === 0)) {
      return null;
    }
    return (
      <div className="p-6 border-b border-gray-200 last:border-b-0">
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">{title}</h2>
        {children}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header Section */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{name || 'Unknown Author'}</h1>
          {birth_date && (
            <p className="text-gray-600 text-lg">Born: {birth_date}</p>
          )}
        </div>

        {/* Bio Section */}
        <Section title="Biography">
          {bio && (
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{bio}</p>
          )}
        </Section>

        {/* Alternate Names Section */}
        <Section title="Also Known As">
          {alternate_names && alternate_names.length > 0 && (
            <ul className="list-disc list-inside text-gray-700">
              {alternate_names.map((altName, index) => (
                <li key={index}>{altName}</li>
              ))}
            </ul>
          )}
        </Section>

        {/* External Links Section */}
        <Section title="External Links">
          {links && links.length > 0 && (
            <ul className="space-y-2">
              {links.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    {link.title || link.url}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Remote Identifiers Section */}
        <Section title="External Identifiers">
          {remote_ids && Object.keys(remote_ids).length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
              {remote_ids.wikidata && (
                <div>
                  <span className="font-medium">Wikidata:</span>{' '}
                  <a
                    href={`https://www.wikidata.org/wiki/${remote_ids.wikidata}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    {remote_ids.wikidata}
                  </a>
                </div>
              )}
              {remote_ids.imdb && (
                <div>
                  <span className="font-medium">IMDb:</span>{' '}
                  <a
                    href={`https://www.imdb.com/name/${remote_ids.imdb}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    {remote_ids.imdb}
                  </a>
                </div>
              )}
              {remote_ids.goodreads && (
                <div>
                  <span className="font-medium">Goodreads:</span>{' '}
                  <a
                    href={`https://www.goodreads.com/author/show/${remote_ids.goodreads}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    {remote_ids.goodreads}
                  </a>
                </div>
              )}
              {/* Add more remote IDs here as needed, or dynamically iterate if many */}
            </div>
          )}
        </Section>

        {/* Photos Count Section */}
        <Section title="Photos">
          {photos && photos.length > 0 ? (
            <p className="text-gray-700">Number of available photos: {photos.length}</p>
          ) : (
            <p className="text-gray-700">No photos available.</p>
          )}
        </Section>
      </div>
    </div>
  );
};

AuthorProfile.propTypes = {
  data: PropTypes.shape({
    name: PropTypes.string,
    bio: PropTypes.string, // Assumed to be a plain string after transformation
    birth_date: PropTypes.string,
    alternate_names: PropTypes.arrayOf(PropTypes.string),
    links: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
        url: PropTypes.string.isRequired,
      })
    ),
    remote_ids: PropTypes.objectOf(PropTypes.string), // Object where keys are ID types and values are ID strings
    photos: PropTypes.arrayOf(PropTypes.number), // Array of photo IDs
  }),
};

export default AuthorProfile;