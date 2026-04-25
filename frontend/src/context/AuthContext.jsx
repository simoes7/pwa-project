import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('smartQueueUser');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      // Safety check: If the ID is not a number (like 'admin_1' from mock phase), clear it
      if (parsed && isNaN(Number(parsed.id))) {
        localStorage.removeItem('smartQueueUser');
        setUser(null);
      } else {
        setUser(parsed);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setAuthError('');
    if (!email || !password) {
      setAuthError('Email and password are required');
      return false;
    }
    
    try {
      const response = await fetch('http://localhost:3001/login', {
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
      const response = await fetch('http://localhost:3001/register', {
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

  return (
    <AuthContext.Provider value={{ user, loading, authError, login, register, logout, setAuthError }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
