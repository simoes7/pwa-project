import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import PWAHandler from './components/PWAHandler';

// Pages (Lazy loaded for optimized bundle sizes)
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const ServicesPage = React.lazy(() => import('./pages/ServicesPage'));
const TicketPage = React.lazy(() => import('./pages/TicketPage'));
const QueueTrackingPage = React.lazy(() => import('./pages/QueueTrackingPage'));
const MapPage = React.lazy(() => import('./pages/MapPage'));
const AdminDashboardPage = React.lazy(() => import('./pages/AdminDashboardPage'));
const AdminAnalyticsPage = React.lazy(() => import('./pages/AdminAnalyticsPage'));
const AdminControlPage = React.lazy(() => import('./pages/AdminControlPage'));
const AdminServicesPage = React.lazy(() => import('./pages/AdminServicesPage'));
const AdminSettingsPage = React.lazy(() => import('./pages/AdminSettingsPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const AuthSuccessPage = React.lazy(() => import('./pages/AuthSuccessPage'));
const SuperAdminPage = React.lazy(() => import('./pages/SuperAdminPage'));
const SupportPage = React.lazy(() => import('./pages/SupportPage'));

// Guards
import ProtectedRoute from './components/ProtectedRoute';

function App() {

  const location = useLocation();
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const isMobile = width <= 1024;
  const isAdminPage = location.pathname.startsWith('/admin') || location.pathname.startsWith('/super-admin');
  const isMapPage = location.pathname === '/map';

  return (
    <>
      <PWAHandler />
      {!isAdminPage && <Navbar />}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <React.Suspense
            fallback={
              <div className="flex flex-col items-center justify-center min-h-[60vh] py-20 font-['Plus_Jakarta_Sans']">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-indigo-950"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-500 animate-pulse tracking-wide uppercase">Loading operational portal...</p>
              </div>
            }
          >
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/tracking" element={<QueueTrackingPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/auth-success" element={<AuthSuccessPage />} />
              <Route
                path="/super-admin"
                element={
                  <ProtectedRoute requireRole="super_admin">
                    <SuperAdminPage />
                  </ProtectedRoute>
                }
              />

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
                  <ProtectedRoute requireRole="admin">
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <ProtectedRoute requireRole="admin">
                    <AdminAnalyticsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/control"
                element={
                  <ProtectedRoute requireRole="admin">
                    <AdminControlPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/services"
                element={
                  <ProtectedRoute requireRole="admin">
                    <AdminServicesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute requireRole="admin">
                    <AdminSettingsPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </React.Suspense>
        </motion.main>
      </AnimatePresence>
      {!isAdminPage && !isMapPage && <Footer />}
      {isMobile && !isAdminPage && <BottomNav />}
    </>
  );
}

export default App;
