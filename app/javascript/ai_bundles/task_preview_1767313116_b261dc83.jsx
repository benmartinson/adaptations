import React from 'react';
import PropTypes from 'prop-types';
import SubTask from './SubTask';

const SectionTitle = ({ children }) => (
  <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4 border-b border-gray-200 pb-1">
    {children}
  </h2>
);

SectionTitle.propTypes = {
  children: PropTypes.node.isRequired,
};

const InfoRow = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-50 last:border-0">
    <span className="text-gray-500 text-sm font-medium">{label}</span>
    <span className="text-gray-900 text-sm break-all">{value}</span>
  </div>
);

InfoRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

const AuthorDashboard = ({ data }) => {
  const {
    name,
    bio,
    birth_date,
    links,
    remote_ids,
    alternate_names,
    photos,
    last_modified,
    AuthorBooks,
    AuthorBooksVertical,
  } = data;

  // Extract bio text from the object structure
  const bioText = typeof bio === 'object' ? bio.value : bio;

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white text-gray-900 font-sans">
      {/* Header Section */}
      <header className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-5xl font-black tracking-tight text-black mb-2">
              {name}
            </h1>
            {birth_date && (
              <p className="text-gray-500 text-lg">
                Born: <span className="text-gray-800">{birth_date}</span>
              </p>
            )}
          </div>
          {photos && photos.length > 0 && (
            <div className="text-xs text-gray-400 font-mono">
              REF_ID: {photos[0]}
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-10">
          {/* Bio Section */}
          <section>
            <SectionTitle>Biography</SectionTitle>
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
              {bioText || "No biography available."}
            </div>
          </section>

          {data.AuthorBooks && (
            <section>
              <SubTask systemTag="AuthorBooks" data={data.AuthorBooks} id={1} />
            </section>
          )}

          {/* Alternate Names */}
          {alternate_names && alternate_names.length > 0 && (
            <section>
              <SectionTitle>Also Known As</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {alternate_names.map((altName, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full"
                  >
                    {altName}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-10">
          {/* Links Section */}
          {links && links.length > 0 && (
            <section>
              <SectionTitle>External Links</SectionTitle>
              <ul className="space-y-3">
                {links.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center text-sm text-gray-600 hover:text-black transition-colors"
                    >
                      <span className="mr-2">→</span>
                      <span className="underline decoration-gray-300 group-hover:decoration-black">
                        {link.title}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Identifiers Section */}
          {remote_ids && (
            <section>
              <SectionTitle>Platform Identifiers</SectionTitle>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                {Object.entries(remote_ids).map(([key, value]) => (
                  <InfoRow
                    key={key}
                    label={key.replace('_', ' ').toUpperCase()}
                    value={value}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Meta Information */}
          <section className="pt-6 border-t border-gray-100">
            <div className="text-[10px] text-gray-400 uppercase tracking-widest leading-loose">
              <div>Last Modified</div>
              <div className="text-gray-600">
                {last_modified?.value || last_modified || "N/A"}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

AuthorDashboard.propTypes = {
  data: PropTypes.shape({
    name: PropTypes.string,
    bio: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        value: PropTypes.string,
      }),
    ]),
    birth_date: PropTypes.string,
    links: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
        url: PropTypes.string,
      })
    ),
    remote_ids: PropTypes.object,
    alternate_names: PropTypes.arrayOf(PropTypes.string),
    photos: PropTypes.arrayOf(PropTypes.number),
    last_modified: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        value: PropTypes.string,
      }),
    ]),
    AuthorBooks: PropTypes.any,
    AuthorBooksVertical: PropTypes.any,
  }).isRequired,
};

export default AuthorDashboard;
