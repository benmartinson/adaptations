import React from 'react';
import PropTypes from 'prop-types';

/**
 * Renders the header section of the author profile, including name, birth date, and photo.
 */
function ProfileHeader({ name, birthDate, photoUrl }) {
  return (
    <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6 p-6 bg-white rounded-lg shadow-md mb-6">
      {photoUrl && (
        <div className="flex-shrink-0">
          <img
            src={photoUrl}
            alt={`${name}'s profile`}
            className="w-32 h-32 object-cover rounded-full border-4 border-indigo-500 shadow-lg"
          />
        </div>
      )}
      <div className="text-center md:text-left flex-grow">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{name}</h1>
        {birthDate && (
          <p className="text-lg text-gray-600 font-medium">Born: {birthDate}</p>
        )}
      </div>
    </div>
  );
}

ProfileHeader.propTypes = {
  name: PropTypes.string.isRequired,
  birthDate: PropTypes.string,
  photoUrl: PropTypes.string,
};

ProfileHeader.defaultProps = {
  birthDate: null,
  photoUrl: null,
};

/**
 * Renders the author's biography.
 */
function ProfileBio({ bioHtml }) {
  if (!bioHtml) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Biography</h2>
      <div
        className="prose prose-indigo max-w-none text-gray-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: bioHtml }}
      />
    </div>
  );
}

ProfileBio.propTypes = {
  bioHtml: PropTypes.string,
};

ProfileBio.defaultProps = {
  bioHtml: null,
};

/**
 * Renders a list of external links for the author.
 */
function ProfileLinks({ links }) {
  if (!links || links.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">External Links</h2>
      <ul className="list-disc list-inside space-y-2">
        {links.map((link, index) => (
          <li key={index} className="text-gray-700">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 font-medium transition duration-300 ease-in-out"
            >
              {link.title || link.url}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

ProfileLinks.propTypes = {
  links: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      url: PropTypes.string.isRequired,
    })
  ),
};

ProfileLinks.defaultProps = {
  links: [],
};

/**
 * Renders a list of alternate names for the author.
 */
function ProfileAlternateNames({ alternateNames }) {
  if (!alternateNames || alternateNames.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Also Known As</h2>
      <ul className="flex flex-wrap gap-2">
        {alternateNames.map((name, index) => (
          <li
            key={index}
            className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium"
          >
            {name}
          </li>
        ))}
      </ul>
    </div>
  );
}

ProfileAlternateNames.propTypes = {
  alternateNames: PropTypes.arrayOf(PropTypes.string),
};

ProfileAlternateNames.defaultProps = {
  alternateNames: [],
};

/**
 * The main component for visualizing author profile data.
 * It takes a 'data' prop which is expected to be pre-transformed
 * and ready for display.
 */
function AuthorProfileViewer({ data }) {
  // Error handling: Check if data is null or undefined
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <p className="text-xl font-semibold text-gray-700">
            Loading profile data... or No profile data available.
          </p>
          <p className="text-gray-500 mt-2">Please ensure valid data is provided.</p>
        </div>
      </div>
    );
  }

  // Destructure data with default values for robustness
  const {
    name = 'Unknown Author',
    bioHtml = null,
    links = [],
    birthDate = null,
    photoUrl = null,
    alternateNames = [],
  } = data;

  // Basic validation for essential data
  if (!name) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <p className="text-xl font-semibold text-red-600">Error: Author name is missing.</p>
          <p className="text-gray-500 mt-2">Cannot display profile without a name.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <ProfileHeader name={name} birthDate={birthDate} photoUrl={photoUrl} />
        <ProfileBio bioHtml={bioHtml} />
        <ProfileLinks links={links} />
        <ProfileAlternateNames alternateNames={alternateNames} />
      </div>
    </div>
  );
}

AuthorProfileViewer.propTypes = {
  /**
   * The transformed API response data containing author details.
   * Expected structure:
   * {
   *   name: string,
   *   bioHtml: string (HTML formatted biography),
   *   links: Array<{ title: string, url: string }>,
   *   birthDate: string,
   *   photoUrl: string,
   *   alternateNames: Array<string>
   * }
   */
  data: PropTypes.shape({
    name: PropTypes.string.isRequired,
    bioHtml: PropTypes.string,
    links: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
        url: PropTypes.string.isRequired,
      })
    ),
    birthDate: PropTypes.string,
    photoUrl: PropTypes.string,
    alternateNames: PropTypes.arrayOf(PropTypes.string),
  }),
};

AuthorProfileViewer.defaultProps = {
  data: null,
};

export default AuthorProfileViewer;