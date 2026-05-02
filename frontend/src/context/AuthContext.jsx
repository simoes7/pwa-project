/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';
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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getInitialUser);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');

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
      localStorage.setItem('smartQueueUser', JSON.stringify(data.user));
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
      localStorage.setItem('smartQueueUser', JSON.stringify(data.user));
      return data.user;
    } catch (error) {
      console.error("Registration error:", error);
      setAuthError('Network error, please try again later');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('smartQueueUser');
  };

  const loginWithGoogle = async () => {
    try {
      const response = await fetch('http://localhost:3001/auth/google', {
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
      window.location.href = 'http://localhost:3001/auth/google';
    } catch (error) {
      console.error('Google OAuth error:', error);
      setAuthError('Unable to connect to Google OAuth. Please check if the backend server is running.');
    }
  };

  const handleGoogleAuthSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('smartQueueUser', JSON.stringify(userData));
    return userData;
  };

  return (
    <AuthContext.Provider value={{ user, loading, authError, login, register, logout, loginWithGoogle, handleGoogleAuthSuccess, setAuthError }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
