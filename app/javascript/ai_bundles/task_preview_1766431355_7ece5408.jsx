import React from 'react';
import PropTypes from 'prop-types';

const AuthorWorksDashboard = ({ data }) => {
  const { entries = [], size = 0, links = {} } = data;

  // Helper to format cover URLs
  const getCoverUrl = (coverId) => {
    if (!coverId || coverId === -1) return 'https://via.placeholder.com/180x270?text=No+Cover';
    return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
  };

  // Helper to extract year
  const getYear = (dateObj) => {
    if (!dateObj || !dateObj.value) return '';
    return new Date(dateObj.value).getFullYear();
  };

  // Helper to extract description text
  const getDescription = (desc) => {
    if (!desc) return '';
    if (typeof desc === 'string') return desc;
    return desc.value || '';
  };

  // Aggregate all unique subjects and places for a "Discovery" section
  const allSubjects = [...new Set(entries.flatMap(e => e.subjects || []))].slice(0, 15);
  const allPlaces = [...new Set(entries.flatMap(e => e.subject_places || []))].slice(0, 10);

  // Prepare items for the global HorizontalCardList
  const cardItems = entries.map((work) => ({
    id: work.key,
    imageUrl: getCoverUrl(work.covers ? work.covers[0] : null),
    firstLineText: work.title,
    secondLineText: work.authors?.length > 1 ? 'Multiple Authors' : 'Andy Weir',
    thirdLineText: getYear(work.created),
  }));

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-8 font-sans">
      {/* Header Section */}
      <header className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-black">Author Works</h1>
            <p className="text-gray-500 mt-2 text-lg">
              Catalog for <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">{links.author || 'Unknown Author'}</span>
            </p>
          </div>
          <div className="mt-4 md:mt-0 text-right">
            <span className="text-5xl font-light text-gray-300">{size}</span>
            <span className="ml-2 text-sm uppercase tracking-widest text-gray-500 font-semibold">Total Works</span>
          </div>
        </div>
      </header>

      {/* Main Horizontal List */}
      <section className="max-w-7xl mx-auto mb-12">
        <HorizontalCardList 
          title="Library Entries" 
          items={cardItems} 
        />
      </section>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Detailed Descriptions Column */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold border-l-4 border-black pl-3 mb-6">Work Highlights</h2>
          {entries
            .filter(e => e.description)
            .map((work) => (
              <div key={work.key} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-black">{work.title}</h3>
                  <span className="text-xs font-mono text-gray-400">{getYear(work.created)}</span>
                </div>
                <p className="text-gray-600 leading-relaxed mb-4 text-sm italic">
                  {getDescription(work.description).substring(0, 300)}...
                </p>
                {work.subjects && (
                  <div className="flex flex-wrap gap-2">
                    {work.subjects.slice(0, 5).map((s, idx) => (
                      <span key={idx} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded uppercase tracking-wider">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* Sidebar Metadata */}
        <div className="space-y-8">
          {/* Subjects Cloud */}
          <div className="bg-black text-white p-6 rounded-lg">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-4 opacity-70">Top Subjects</h2>
            <div className="flex flex-wrap gap-2">
              {allSubjects.map((subject, idx) => (
                <span key={idx} className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded transition-colors cursor-default">
                  {subject}
                </span>
              ))}
            </div>
          </div>

          {/* Places Section */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-4 text-gray-400">Subject Places</h2>
            <ul className="space-y-2">
              {allPlaces.map((place, idx) => (
                <li key={idx} className="text-sm flex items-center text-gray-700">
                  <span className="w-1.5 h-1.5 bg-black rounded-full mr-2"></span>
                  {place}
                </li>
              ))}
            </ul>
          </div>

          {/* External Resources */}
          <div className="bg-gray-100 p-6 rounded-lg">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-4 text-gray-500">Resources</h2>
            <div className="space-y-3">
              {entries.flatMap(e => e.links || []).slice(0, 4).map((link, idx) => (
                <div key={idx} className="group">
                  <p className="text-xs font-bold text-gray-400 uppercase truncate">{link.title || 'Link'}</p>
                  <a 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-blue-600 hover:text-blue-800 break-all underline decoration-gray-300 underline-offset-4"
                  >
                    {link.url}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <footer className="max-w-7xl mx-auto mt-16 pt-8 border-t border-gray-200 text-center">
        <div className="flex justify-center gap-8 text-xs font-medium text-gray-400 uppercase tracking-widest">
          <div>Latest Revision: {entries[0]?.latest_revision || 'N/A'}</div>
          <div>•</div>
          <div>Last Modified: {new Date(entries[0]?.last_modified?.value).toLocaleDateString() || 'N/A'}</div>
        </div>
      </footer>
    </div>
  );
};

AuthorWorksDashboard.propTypes = {
  data: PropTypes.shape({
    links: PropTypes.object,
    size: PropTypes.number,
    entries: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
        key: PropTypes.string,
        description: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
        subjects: PropTypes.array,
        subject_places: PropTypes.array,
        covers: PropTypes.array,
        created: PropTypes.object,
        last_modified: PropTypes.object,
      })
    ),
  }).isRequired,
};

export default AuthorWorksDashboard;