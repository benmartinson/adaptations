const AuthorProfile = ({ data }) => {
  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50 rounded-xl border border-dashed border-gray-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading author profile...</p>
        </div>
      </div>
    );
  }