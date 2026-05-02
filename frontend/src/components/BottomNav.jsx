import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const BottomNav = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { name: 'Home', path: '/', icon: 'home' },
    { name: 'Services', path: '/services', icon: 'list' },
    { name: 'Map', path: '/map', icon: 'explore' },
    { name: 'My Ticket', path: '/ticket', icon: 'confirmation_number' },
    { name: 'Help', path: '/support', icon: 'help' },
  ];

  return (
    <nav className="glass-panel animate-fade-in" style={styles.bottomNav}>
      {navLinks.map((link) => (
        <Link 
          key={link.path} 
          to={link.path} 
          style={isActive(link.path) ? styles.navItemActive : styles.navItemInactive}
        >
          <span 
            className="material-symbols-outlined" 
            style={isActive(link.path) ? { fontVariationSettings: "'FILL' 1" } : {}}
          >
            {link.icon}
          </span>
          <span style={styles.navText}>{link.name}</span>
        </Link>
      ))}
    </nav>
  );
};

const styles = {
  bottomNav: {
    display: 'flex',
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '5rem',
    borderTop: '1px solid var(--surface-container-low)',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(20px)',
    borderRadius: '0',
    padding: '0 0.5rem'
  },
  navItemInactive: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
    color: '#64748b',
    textDecoration: 'none',
    flex: 1
  },
  navItemActive: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
    color: 'var(--primary)',
    textDecoration: 'none',
    flex: 1
  },
  navText: {
    fontSize: '0.625rem',
    fontWeight: '800',
    textTransform: 'uppercase'
  }
};

export default BottomNav;
