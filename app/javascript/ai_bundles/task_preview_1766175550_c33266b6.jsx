import React from 'react';
import PropTypes from 'prop-types';

const SectionTitle = ({ children }) => (
  <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-100 pb-1">
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
    className="group flex items-center justify-between py-2 text-sm text-gray-600 hover:text-black transition-colors border-b border-gray-50 last:border-0"
  >
    <span>{title}</span>
    <span className="text-gray-300 group-hover:text-black transition-transform group-hover:translate-x-0.5">→</span>
  </a>
);

ExternalLink.propTypes = {
  title: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
};

const AuthorProfile = ({ data }) => {
  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full bg-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">Loading</p>
        </div>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full bg-white p-8">
        <div className="max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 mb-4">
            <span className="text-gray-400 font-bold">!</span>
          </div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Data Unavailable</h3>
          <p className="mt-2 text-xs text-gray-500 leading-relaxed">{data.error}</p>
        </div>
      </div>
    );
  }

  const {
    name,
    bio,
    birth_date,
    links,
    remote_ids,
    photos,
    last_modified,
    key
  } = data;

  const bioText = typeof bio === 'object' ? bio.value : bio;
  const photoId = photos && photos.length > 0 ? photos[0] : null;

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-gray-100">
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        {/* Header */}
        <header className="mb-16">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
            <div className="flex-1 order-2 md:order-1">
              <div className="mb-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 block mb-2">
                  Author
                </span>
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-black">
                  {name}
                </h1>
              </div>
              {birth_date && (
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="w-8 h-px bg-gray-200" />
                  <span>Born {birth_date}</span>
                </div>
              )}
            </div>

            {photoId && (
              <div className="order-1 md:order-2 flex-shrink-0">
                <div className="relative group">
                  <div className="absolute -inset-2 bg-gray-50 rounded-lg scale-95 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500" />
                  <img
                    src={`https://covers.openlibrary.org/a/id/${photoId}-M.jpg`}
                    alt={name}
                    className="relative w-32 h-32 md:w-44 md:h-44 object-cover rounded shadow-sm grayscale hover:grayscale-0 transition-all duration-700"
                  />
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Content */}
          <div className="lg:col-span-7 space-y-12">
            {bioText && (
              <section>
                <SectionTitle>Biography</SectionTitle>
                <div className="text-gray-600 leading-relaxed text-base md:text-lg whitespace-pre-wrap font-serif italic">
                  {bioText}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-5 space-y-12">
            {links && links.length > 0 && (
              <section>
                <SectionTitle>Resources</SectionTitle>
                <div className="flex flex-col">
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
                <SectionTitle>Database Identifiers</SectionTitle>
                <div className="grid grid-cols-1 gap-y-4">
                  {Object.entries(remote_ids).map(([idKey, idValue]) => (
                    <div key={idKey} className="group">
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5 group-hover:text-gray-600 transition-colors">
                        {idKey.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-500 font-mono break-all bg-gray-50 p-1.5 rounded-sm">
                        {idValue}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Footer Metadata */}
            <section className="pt-8 border-t border-gray-100">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-widest font-semibold">
                  <span className="text-gray-400">System ID</span>
                  <span className="text-gray-900">{key}</span>
                </div>
                {last_modified && (
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-widest font-semibold">
                    <span className="text-gray-400">Last Updated</span>
                    <span className="text-gray-900">
                      {new Date(last_modified.value).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}
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