export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const apiPath = (path) => `${API_URL}${path}`;

export const adminHeaders = (user, token) => ({
  'Content-Type': 'application/json',
  'x-user-role': user?.role || '',
  ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
});
