/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiPath } from '../config';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const getInitialUser = () => {
  const storedUser = localStorage.getItem('smartQueueUser');
  if (!storedUser) return null;
  try {
    const parsed = JSON.parse(storedUser);
    if (parsed && Number.isNaN(Number(parsed.id))) {
      localStorage.removeItem('smartQueueUser');
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem('smartQueueUser');
    return null;
  }
};

const getInitialToken = () => {
  return localStorage.getItem('smartQueueToken') || null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getInitialUser);
  const [token, setToken] = useState(getInitialToken);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Setup fetch interceptor or helper
  const authFetch = async (url, options = {}) => {
    const headers = { ...options.headers };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(url, { ...options, headers });
  };

  const login = async (email, password) => {
    setAuthError('');
    if (!email || !password) {
      setAuthError('Email and password are required');
      return false;
    }

    try {
      const response = await fetch(apiPath('/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthError(data.error || 'Login failed');
        return false;
      }

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('smartQueueUser', JSON.stringify(data.user));
      if (data.token) localStorage.setItem('smartQueueToken', data.token);
      return data.user;
    } catch (error) {
      console.error("Login error:", error);
      setAuthError('Network error, please try again later');
      return false;
    }
  };

  const register = async (name, email, password) => {
    setAuthError('');
    if (!name || !email || !password) {
      setAuthError('All fields are required');
      return false;
    }

    try {
      const response = await fetch(apiPath('/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthError(data.error || 'Registration failed');
        return false;
      }

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('smartQueueUser', JSON.stringify(data.user));
      if (data.token) localStorage.setItem('smartQueueToken', data.token);
      return data.user;
    } catch (error) {
      console.error("Registration error:", error);
      setAuthError('Network error, please try again later');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('smartQueueUser');
    localStorage.removeItem('smartQueueToken');
  };

  const loginWithGoogle = async () => {
    try {
      const response = await fetch(apiPath('/auth/google'), {
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json();
        if (error.error === 'Google OAuth not configured') {
          setAuthError('Google OAuth is not configured. Please check the setup guide and configure your Google OAuth credentials.');
          return;
        }
        throw new Error(error.message || 'Google OAuth setup error');
      }
      window.location.href = apiPath('/auth/google');
    } catch (error) {
      console.error('Google OAuth error:', error);
      setAuthError('Unable to connect to Google OAuth. Please check if the backend server is running.');
    }
  };

  const handleGoogleAuthSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('smartQueueUser', JSON.stringify(userData));
    // Since Google OAuth currently uses sessions on backend, we might not have a JWT.
    // If backend returns one in the future, we'd set it here.
    return userData;
  };

  return (
    <AuthContext.Provider value={{ user, token, authFetch, loading, authError, login, register, logout, loginWithGoogle, handleGoogleAuthSuccess, setAuthError }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
