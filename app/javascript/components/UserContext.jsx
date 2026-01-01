import React, { createContext, useContext, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('user_id');

  const value = useMemo(() => ({
    userId,
  }), [userId]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export default UserContext;
