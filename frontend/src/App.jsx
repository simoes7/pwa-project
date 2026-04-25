import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import LandingPage from './pages/LandingPage';
import ServicesPage from './pages/ServicesPage';
import TicketPage from './pages/TicketPage';
import QueueTrackingPage from './pages/QueueTrackingPage';
import MapPage from './pages/MapPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import AdminControlPage from './pages/AdminControlPage';
import AdminServicesPage from './pages/AdminServicesPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

import SupportPage from './pages/SupportPage';

// Guards
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

function App() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const isMapPage = location.pathname === '/map';

  return (
    <>
      {!isAdminPage && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/tracking" element={<QueueTrackingPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/ticket"
            element={
              <ProtectedRoute>
                <TicketPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <AdminRoute>
                <AdminAnalyticsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/control"
            element={
              <AdminRoute>
                <AdminControlPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/services"
            element={
              <AdminRoute>
                <AdminServicesPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <AdminRoute>
                <AdminSettingsPage />
              </AdminRoute>
            }
          />
        </Routes>
      </main>
      {!isAdminPage && !isMapPage && <Footer />}
    </>
  );
}

export default App;
