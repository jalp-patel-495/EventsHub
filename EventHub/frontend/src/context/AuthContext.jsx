import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore session from localStorage on startup
  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken');

      if (storedUser && token) {
        try {
          setUser(JSON.parse(storedUser));
          
          // Verify session is still valid with backend and get fresh details
          const response = await api.get('accounts/profile/');
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        } catch (err) {
          console.error("Token verification failed, logging out:", err);
          handleLogout();
        }
      }
      setLoading(false);
    };

    initializeAuth();

    // Listen for axios interceptor logout signals
    const handleAuthLogout = () => {
      handleLogout();
    };

    window.addEventListener('auth-logout', handleAuthLogout);
    return () => {
      window.removeEventListener('auth-logout', handleAuthLogout);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    setError(null);
  };

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('accounts/login/', { email, password });
      const { access, refresh, user: userData } = response.data;
      
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      return userData;
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Invalid credentials or unverified account.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await api.post('accounts/logout/', { refresh_token: refreshToken });
      } catch (err) {
        console.error("Logout request failed on backend:", err);
      }
    }
    handleLogout();
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('accounts/register/', userData);
      return response.data;
    } catch (err) {
      const fields = err.response?.data;
      let errorMsg = 'Registration failed.';
      if (fields) {
        const errors = Object.entries(fields).map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(' ') : val}`);
        errorMsg = errors.join(' | ');
      }
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    setError(null);
    try {
      // Support multipart form data for avatar uploads
      const config = {
        headers: {
          'Content-Type': profileData instanceof FormData ? 'multipart/form-data' : 'application/json'
        }
      };
      const response = await api.put('accounts/profile/', profileData, config);
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Profile update failed.';
      setError(msg);
      throw new Error(msg);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
