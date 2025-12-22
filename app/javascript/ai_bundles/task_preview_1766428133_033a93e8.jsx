import React from 'react';
import PropTypes from 'prop-types';

/**
 * AuthorWorksDashboard
 * 
 * A comprehensive visualization of an author's body of work, 
 * featuring a summary, a horizontal browsing list, and detailed 
 * work descriptions.
 */
const AuthorWorksDashboard = ({ data }) => {
  const { authorName, totalWorks, works } = data;

  if (!works || works.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
        No works found for this author.
      </div>
    );
  }

  // Prepare items for the HorizontalCardList component
  const horizontalItems = works.map((work) => ({
    id: work.id,
    imageUrl: work.coverUrl,
    firstLineText: work.title,
    secondLineText: work.year || 'N/A',
    thirdLineText: work.subjects?.[0] || ''
  }));

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 bg-white text-gray-900 space-y-12">
      {/* Header Section */}
      <header className="border-b border-gray-200 pb-8">
        <h1 className="text-4xl font-black tracking-tight text-black mb-2">
          {authorName || 'Author Portfolio'}
        </h1>
        <div className="flex items-center gap-4 text-sm text-gray-500 uppercase tracking-widest font-semibold">
          <span>{totalWorks} Published Works</span>
          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
          <span>Open Library Collection</span>
        </div>
      </header>

      {/* Quick Browse Section */}
      <section>
        <HorizontalCardList 
          title="Bibliography Overview" 
          items={horizontalItems} 
        />
      </section>

      {/* Detailed Works Grid */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-black">Detailed Catalog</h2>
          <span className="text-xs text-gray-400 font-mono">SORTED BY RELEVANCE</span>
        </div>
        
        <div className="grid grid-cols-1 gap-12">
          {works.map((work) => (
            <WorkDetailItem key={work.id} work={work} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-12 border-t border-gray-100 text-center text-gray-400 text-xs">
        <p>© Data provided by Open Library API. All rights reserved by the respective authors.</p>
      </footer>
    </div>
  );
};

/**
 * WorkDetailItem
 * 
 * Displays expanded information about a specific book/work.
 */
const WorkDetailItem = ({ work }) => {
  const { title, description, subjects, places, people, coverUrl, year } = work;

  return (
    <div className="flex flex-col md:flex-row gap-8 group">
      {/* Cover Image Column */}
      <div className="w-full md:w-48 flex-shrink-0">
        <div className="aspect-[2/3] bg-gray-100 rounded-sm overflow-hidden border border-gray-200 shadow-sm transition-transform duration-300 group-hover:scale-[1.02]">
          {coverUrl ? (
            <img 
              src={coverUrl} 
              alt={title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Content Column */}
      <div className="flex-grow space-y-4">
        <div>
          <h3 className="text-2xl font-bold text-black group-hover:text-gray-700 transition-colors">
            {title}
          </h3>
          {year && <p className="text-gray-400 font-medium">{year}</p>}
        </div>

        {description && (
          <p className="text-gray-600 leading-relaxed max-w-3xl line-clamp-4 hover:line-clamp-none transition-all cursor-default">
            {description}
          </p>
        )}

        <div className="flex flex-wrap gap-y-4 pt-2">
          {/* Subjects */}
          {subjects && subjects.length > 0 && (
            <div className="w-full">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-tighter mb-2">Key Subjects</h4>
              <div className="flex flex-wrap gap-2">
                {subjects.slice(0, 6).map((tag, idx) => (
                  <Tag key={idx} text={tag} />
                ))}
              </div>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full pt-2">
            {places && places.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-tighter mb-1">Settings</h4>
                <p className="text-sm text-gray-700">{places.slice(0, 3).join(' • ')}</p>
              </div>
            )}
            {people && people.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-tighter mb-1">Key Characters</h4>
                <p className="text-sm text-gray-700">{people.slice(0, 3).join(' • ')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Tag Component
 */
const Tag = ({ text }) => (
  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider rounded border border-gray-200">
    {text}
  </span>
);

// Prop Validation
AuthorWorksDashboard.propTypes = {
  data: PropTypes.shape({
    authorName: PropTypes.string,
    totalWorks: PropTypes.number,
    works: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        description: PropTypes.string,
        coverUrl: PropTypes.string,
        year: PropTypes.string,
        subjects: PropTypes.arrayOf(PropTypes.string),
        places: PropTypes.arrayOf(PropTypes.string),
        people: PropTypes.arrayOf(PropTypes.string),
      })
    ),
  }).isRequired,
};

WorkDetailItem.propTypes = {
  work: PropTypes.object.isRequired,
};

Tag.propTypes = {
  text: PropTypes.string.isRequired,
};

export default AuthorWorksDashboard;