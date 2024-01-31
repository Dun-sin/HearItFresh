import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setLoggedIn] = useState(false);

  const toggleLoginStatus = () => {
    setLoggedIn(prevStatus => !prevStatus);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, toggleLoginStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
