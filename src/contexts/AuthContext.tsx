import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined); // Export the context

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('jwt');
    setIsAuthenticated(!!token);
  }, []);

  const login = (token: string) => {
    localStorage.setItem('jwt', token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('jwt');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};