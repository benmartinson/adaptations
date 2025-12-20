import React from 'react';
import PropTypes from 'prop-types';

const SectionTitle = ({ children }) => (
  <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
    {children}
  </h2>
);

SectionTitle.propTypes = {
  children: PropTypes.node.isRequired,
};

const ExternalLink = ({ title, url }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className="block py-1 text-sm text-gray-600 hover:text-black transition-colors duration-200 underline decoration-gray-300 underline-offset-4"
  >
    {title}
  </a>
);

ExternalLink.propTypes = {
  title: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
};

const Badge = ({ children }) => (
  <span className="inline-block px-2 py-1 mr-2 mb-2 text-xs font-medium bg-gray-100 text-gray-600 rounded">
    {children}
  </span>
);

Badge.propTypes = {
  children: PropTypes.node.isRequired,
};

const AuthorProfile = ({ data }) => {
  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full bg-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading profile data...</p>
        </div>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full bg-white p-6">
        <div className="max-w-md text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 mb-4">
            <span className="text-xl text-gray-400">!</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Unable to load author</h3>
          <p className="mt-2 text-sm text-gray-500">{data.error || 'An unexpected error occurred while fetching the author profile.'}</p>
        </div>
      </div>
    );
  }

  const {
    name,
    bio,
    birth_date,
    alternate_names,
    links,
    remote_ids,
    photos,
    last_modified,
    key
  } = data;

  const bioText = typeof bio === 'object' ? bio.value : bio;
  const photoId = photos && photos.length > 0 ? photos[0] : null;

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <header className="border-b border-gray-100 pb-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Author Profile</span>
                <span className="h-px w-8 bg-gray-200" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-black mb-4">
                {name}
              </h1>
              {birth_date && (
                <p className="text-gray-500 text-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                  Born {birth_date}
                </p>
              )}
            </div>
            
            {photoId && (
              <div className="flex-shrink-0">
                <img
                  src={`https://covers.openlibrary.org/a/id/${photoId}-M.jpg`}
                  alt={name}
                  className="w-32 h-32 md:w-40 md:h-40 object-cover bg-gray-50 rounded-sm grayscale hover:grayscale-0 transition-all duration-500 border border-gray-100 shadow-sm"
                />
              </div>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content */}
          <main className="lg:col-span-8 space-y-10">
            {bioText && (
              <section>
                <SectionTitle>Biography</SectionTitle>
                <div className="text-gray-700 leading-relaxed space-y-4 whitespace-pre-wrap max-w-none text-base md:text-lg italic font-serif">
                  {bioText}
                </div>
              </section>
            )}

            {alternate_names && alternate_names.length > 0 && (
              <section>
                <SectionTitle>Also Known As</SectionTitle>
                <div className="flex flex-wrap">
                  {alternate_names.map((altName, idx) => (
                    <Badge key={idx}>{altName}</Badge>
                  ))}
                </div>
              </section>
            )}
          </main>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-10">
            {links && links.length > 0 && (
              <section>
                <SectionTitle>Official Links</SectionTitle>
                <div className="space-y-1">
                  {links.map((link, idx) => (
                    <ExternalLink 
                      key={idx} 
                      title={link.title} 
                      url={link.url} 
                    />
                  ))}
                </div>
              </section>
            )}

            {remote_ids && (
              <section>
                <SectionTitle>Identifiers</SectionTitle>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                  {Object.entries(remote_ids).map(([key, value]) => (
                    <div key={key} className="overflow-hidden">
                      <p className="text-[10px] uppercase font-bold text-gray-400 truncate">{key}</p>
                      <p className="text-xs text-gray-600 font-mono truncate" title={value}>{value}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="pt-8 border-t border-gray-50">
              <div className="bg-gray-50 p-4 rounded-sm">
                <p className="text-[10px] text-gray-400 uppercase font-semibold mb-2">Metadata</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">Resource Key</span>
                    <span className="text-gray-800 font-mono">{key}</span>
                  </div>
                  {last_modified && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500">Last Modified</span>
                      <span className="text-gray-800">
                        {new Date(last_modified.value).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

AuthorProfile.propTypes = {
  data: PropTypes.shape({
    name: PropTypes.string,
    bio: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        value: PropTypes.string
      })
    ]),
    birth_date: PropTypes.string,
    alternate_names: PropTypes.arrayOf(PropTypes.string),
    links: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
        url: PropTypes.string
      })
    ),
    remote_ids: PropTypes.object,
    photos: PropTypes.arrayOf(PropTypes.number),
    key: PropTypes.string,
    last_modified: PropTypes.shape({
      value: PropTypes.string
    }),
    error: PropTypes.string
  })
};

export default AuthorProfile;