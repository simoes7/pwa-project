import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requireRole, requireAuth = true }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface-container-lowest">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-on-surface-variant font-medium animate-pulse">Verifying access...</p>
        </div>
      </div>
    );
  }

  // If requires authentication and user is not logged in
  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  // If requires specific roles and user doesn't have it
  if (requireRole) {
    const roles = Array.isArray(requireRole) ? requireRole : [requireRole];
    if (!user || !roles.includes(user.role)) {
      // Redirect to appropriate dashboard if logged in, else login
      if (user) {
        if (user.role === 'super_admin') return <Navigate to="/superadmin" replace />;
        if (user.role === 'admin') return <Navigate to="/admin" replace />;
        return <Navigate to="/" replace />; // fallback
      }
      return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
