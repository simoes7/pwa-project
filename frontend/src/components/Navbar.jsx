import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import Logo from './Logo';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const navLinks = [
    { name: 'Services', path: '/services' },
    { name: 'Map', path: '/map' },
    { name: 'My Ticket', path: '/ticket' },
    { name: 'Support', path: '/support' },
  ];

  return (
    <nav style={styles.navbar} className="ethereal-blur">
      <div style={styles.inner}>
        {/* Logo */}
        <div style={styles.logoContainer}>
          <Link to="/" style={styles.logoLink} onClick={() => setIsMobileMenuOpen(false)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Logo className="w-10 h-10" />
              <span className="headline text-gradient" style={styles.logoText}>Smart Queue</span>
            </div>
          </Link>
        </div>

        {/* Center Links (Desktop) */}
        <div style={styles.linksContainer} className="hide-mobile">
          {navLinks.map((link) => (
            <Link 
              key={link.path}
              to={link.path} 
              style={{...styles.link, ...(isActive(link.path) ? styles.activeLink : {})}}
            >
              {link.name}
            </Link>
          ))}
          {user?.role === 'admin' && (
            <Link to="/admin" style={{...styles.link, ...(isActive('/admin') ? styles.activeLink : {}), color: 'var(--secondary)'}}>Admin Hub</Link>
          )}
        </div>

        {/* Right Auth (Desktop) */}
        <div style={styles.authContainer} className="hide-mobile">
          {user ? (
            <div style={styles.profileContainer}>
              <span style={styles.userName}>{user.name}</span>
              <button 
                onClick={handleLogout} 
                style={styles.logoutBtn}
                title="Logout"
              >
                <span className="material-symbols-outlined">logout</span>
              </button>
            </div>
          ) : (
            <div style={styles.authButtons}>
              <Link to="/login" style={styles.loginBtn}>Login</Link>
              <Link to="/register" style={{ textDecoration: 'none' }}>
                <button className="primary-gradient" style={styles.getStartedBtn}>
                  Get Started
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          style={styles.mobileToggle} 
          className="show-mobile"
          onClick={toggleMobileMenu}
        >
          <span className="material-symbols-outlined">
            {isMobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div style={styles.mobileDrawer} className="ethereal-blur">
          <div style={styles.mobileNavLinks}>
            {navLinks.map((link) => (
              <Link 
                key={link.path}
                to={link.path} 
                style={{...styles.mobileLink, ...(isActive(link.path) ? styles.mobileActiveLink : {})}}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            {user?.role === 'admin' && (
              <Link 
                to="/admin" 
                style={{...styles.mobileLink, color: 'var(--secondary)'}}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Admin Hub
              </Link>
            )}
            
            <div style={styles.mobileAuthSection}>
              {user ? (
                <div style={styles.mobileProfile}>
                  <div style={styles.mobileUserText}>
                    <p style={styles.mobileUserName}>{user.name}</p>
                    <p style={styles.mobileUserEmail}>{user.email}</p>
                  </div>
                  <button onClick={handleLogout} style={styles.mobileLogoutBtn}>
                    <span className="material-symbols-outlined">logout</span>
                    Logout
                  </button>
                </div>
              ) : (
                <div style={styles.mobileAuthButtons}>
                  <Link 
                    to="/login" 
                    style={styles.mobileLoginBtn}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    style={{ textDecoration: 'none', width: '100%' }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <button className="primary-gradient" style={styles.mobileGetStartedBtn}>
                      Get Started
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

const styles = {
  navbar: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    position: 'fixed',
    top: 0,
    width: '100%',
    zIndex: 1000,
    boxShadow: '0 8px 30px rgba(13, 52, 89, 0.06)',
    height: '80px',
    display: 'flex',
    alignItems: 'center'
  },
  inner: {
    maxWidth: '1280px',
    width: '100%',
    margin: '0 auto',
    padding: '0 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center'
  },
  logoLink: {
    textDecoration: 'none'
  },
  logoText: {
    fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
    fontWeight: '800',
    letterSpacing: '-0.05em',
    fontFamily: '"Plus Jakarta Sans", sans-serif'
  },
  linksContainer: {
    display: 'flex',
    gap: '2rem',
    alignItems: 'center'
  },
  link: {
    color: 'var(--on-surface-variant)',
    fontWeight: '700',
    fontSize: '0.875rem',
    textDecoration: 'none',
    transition: 'all 0.3s ease',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontFamily: '"Plus Jakarta Sans", sans-serif'
  },
  activeLink: {
    color: 'var(--primary)',
  },
  authContainer: {
    display: 'flex',
    alignItems: 'center'
  },
  authButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  loginBtn: {
    color: 'var(--on-surface-variant)',
    fontWeight: '700',
    fontSize: '0.875rem',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    textDecoration: 'none',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    transition: 'color 0.2s',
    fontFamily: '"Plus Jakarta Sans", sans-serif'
  },
  getStartedBtn: {
    padding: '0.75rem 1.75rem',
    borderRadius: '9999px',
    fontWeight: '700',
    fontSize: '0.875rem',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 8px 20px rgba(0, 85, 215, 0.2)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontFamily: '"Plus Jakarta Sans", sans-serif'
  },
  profileContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  userName: {
    fontWeight: '700',
    color: 'var(--on-surface)',
    fontSize: '0.875rem'
  },
  logoutBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--error)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.5rem',
    borderRadius: '50%',
    transition: 'background-color 0.2s'
  },
  mobileToggle: {
    background: 'none',
    border: 'none',
    color: 'var(--on-surface)',
    cursor: 'pointer',
    padding: '0.5rem'
  },
  mobileDrawer: {
    position: 'fixed',
    top: '80px',
    left: 0,
    width: '100%',
    height: 'calc(100vh - 80px)',
    backgroundColor: 'rgba(248, 249, 255, 0.95)',
    zIndex: 999,
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column'
  },
  mobileNavLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  mobileLink: {
    fontSize: '1.5rem',
    fontWeight: '700',
    textDecoration: 'none',
    color: 'var(--on-surface-variant)',
    fontFamily: '"Plus Jakarta Sans", sans-serif'
  },
  mobileActiveLink: {
    color: 'var(--primary)'
  },
  mobileAuthSection: {
    marginTop: '2rem',
    paddingTop: '2rem',
    borderTop: '1px solid var(--surface-container-high)'
  },
  mobileAuthButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  mobileLoginBtn: {
    textAlign: 'center',
    padding: '1rem',
    fontSize: '1.125rem',
    fontWeight: '700',
    color: 'var(--on-surface-variant)',
    textDecoration: 'none'
  },
  mobileGetStartedBtn: {
    width: '100%',
    padding: '1rem',
    borderRadius: '1rem',
    color: 'white',
    fontSize: '1.125rem',
    fontWeight: '700',
    border: 'none'
  },
  mobileProfile: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  mobileUserText: {
    marginBottom: '0.5rem'
  },
  mobileUserName: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: 'var(--on-surface)'
  },
  mobileUserEmail: {
    fontSize: '0.875rem',
    color: 'var(--on-surface-variant)'
  },
  mobileLogoutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '1rem',
    borderRadius: '1rem',
    border: '1px solid var(--error)',
    color: 'var(--error)',
    backgroundColor: 'transparent',
    fontWeight: '700',
    fontSize: '1.125rem',
    cursor: 'pointer'
  }
};

export default Navbar;
