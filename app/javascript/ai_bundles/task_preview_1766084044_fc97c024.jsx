const SectionTitle = ({ children }) => (
  <h2 className="text-xl font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">
    {children}
  </h2>
);
SectionTitle.propTypes = {
  children: PropTypes.node.isRequired,
};