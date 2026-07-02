import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('accessToken'));
  const [loading, setLoading] = useState(true);

  // Check auth profile on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('accessToken');
      if (storedToken) {
        try {
          const response = await api.get('/api/v1/auth/me');
          setUser(response.data.user);
        } catch (error) {
          // api.js response interceptor handles automatic token refreshing.
          // If we still hit this catch block, the token is invalid/expired.
          localStorage.removeItem('accessToken');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Listen for forced logout events from the axios interceptor (e.g. refresh token expired)
  useEffect(() => {
    const handleForcedLogout = () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem('accessToken');
    };

    window.addEventListener('auth-logout', handleForcedLogout);
    return () => {
      window.removeEventListener('auth-logout', handleForcedLogout);
    };
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/v1/auth/login', { email, password });
      const { accessToken, user: userData } = response.data;
      
      localStorage.setItem('accessToken', accessToken);
      setToken(accessToken);
      setUser(userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error occurred' };
    }
  };

  const register = async (name, email, password, role) => {
    try {
      const response = await api.post('/api/v1/auth/register', { name, email, password, role });
      const { accessToken, user: userData } = response.data;
      
      localStorage.setItem('accessToken', accessToken);
      setToken(accessToken);
      setUser(userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error occurred' };
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } catch (error) {
      // Ignore failures on logout API and clear local state anyway
    } finally {
      localStorage.removeItem('accessToken');
      setToken(null);
      setUser(null);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
