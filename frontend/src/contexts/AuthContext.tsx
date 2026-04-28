import React, { createContext, useContext, ReactNode, useState } from 'react';

// Define the shape of the context data
interface AuthContextType {
  user: {
    name: string;
    email?: string;
    username?: string;
    role?: string;
  } | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  register: (username: string, email: string, password: string, name: string) => Promise<void>;
}

// Create the context with a default value
// Provide a default value that matches AuthContextType, or undefined if not initialized
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthContextType['user'] | null>({
    name: 'Dr. Smith',
    email: 'dr.smith@afyalens.com',
    username: 'drsmith',
    role: 'Clinician',
  }); // Mock user
  const [loading, setLoading] = useState(false); // Mock loading state

  const login = async (username: string, password: string) => {
    setLoading(true);
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setUser({ name: username }); // Set user after successful login
    setLoading(false);
  };

  const logout = () => {
    setUser(null); // Clear user on logout
  };

  const register = async (username: string, email: string, password: string, name: string) => {
    setLoading(true);
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setUser({ name, username, email, role: 'User' }); // Set user after successful registration
    setLoading(false);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};