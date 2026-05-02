import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SuperAdminRoute = ({ children }) => {
  const { user } = useAuth();

  // Development bypass - Remove this for production!
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  // Check if user is authenticated and has super_admin role (bypass for local development)
  if (!isDevelopment && !user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has super_admin role (bypass for local development)
  if (!isDevelopment && user.role !== 'super_admin') {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default SuperAdminRoute;
