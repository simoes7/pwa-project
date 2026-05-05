import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import { apiPath, adminHeaders } from '../config';

const AdminSidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [businessName, setBusinessName] = React.useState('Smart Queue');

  React.useEffect(() => {
    const fetchBrand = async () => {
      if (!user?.serviceId) return;
      try {
        const res = await fetch(apiPath(`/settings?serviceId=${user.serviceId}`), { headers: adminHeaders(user) });
        if (res.ok) {
          const data = await res.json();
          const nameSetting = data.find(s => s.setting_key === 'business_name');
          if (nameSetting) setBusinessName(nameSetting.setting_value);
        }
      } catch { /* ignore */ }
    };
    fetchBrand();
  }, [user]);

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/admin' },
    { id: 'analytics', label: 'Analytics', icon: 'analytics', path: '/admin/analytics' },
    { id: 'control', label: 'Queue Control', icon: 'confirmation_number', path: '/admin/control' },
    { id: 'services', label: 'Service Points', icon: 'location_on', path: '/admin/services' },
    { id: 'settings', label: 'Settings', icon: 'settings', path: '/admin/settings' }
  ];

  const handleLinkClick = () => {
    if (window.innerWidth <= 1024) {
      setIsOpen(false);
    }
  };

  return (
    <aside
      className={`admin-sidebar ${isOpen ? 'open' : ''}`}
      style={styles.sidebar}
    >
      <div style={styles.sidebarBrand}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Logo className="w-8 h-8" />
            <div>
              <h1 className="headline" style={styles.brandTitle}>{businessName}</h1>
              <p style={styles.brandSubtitle}>Central Hub</p>
            </div>
          </div>
          <button
            className="show-mobile"
            style={styles.closeBtn}
            onClick={() => setIsOpen(false)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>

      <nav style={styles.sidebarNav}>
        {navItems.map(item => (
          <Link
            key={item.id}
            to={item.path}
            style={isActive(item.path) ? styles.navLinkActive : styles.navLink}
            onClick={handleLinkClick}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div style={styles.sidebarFooter}>
        <button className="primary-gradient" style={styles.newServiceBtn}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          <span className="hide-tablet">New Service Point</span>
        </button>

        <Link to="/support" style={styles.footerLink} onClick={handleLinkClick}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>help</span>
          <span>Support</span>
        </Link>

        <div style={styles.adminProfile}>
          <div style={styles.avatarWrap}>
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&h=150&auto=format&fit=crop"
              alt="Profile"
              style={styles.avatarImg}
            />
          </div>
          <div style={styles.profileText}>
            <p style={styles.adminName}>{user?.name || 'Admin User'}</p>
            <p style={styles.adminRole}>Systems Head</p>
          </div>
          <button onClick={logout} style={styles.logoutBtn}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

const styles = {
  sidebar: {
    width: '260px',
    backgroundColor: 'white',
    borderRight: '1px solid var(--surface-container-low)',
    height: '100vh',
    position: 'fixed',
    top: 0,
    left: 0,
    display: 'flex',
    flexDirection: 'column',
    padding: '2.5rem 0',
    zIndex: 1000
  },
  sidebarBrand: {
    padding: '0 2rem',
    marginBottom: '3rem'
  },
  brandTitle: {
    fontSize: '1.25rem',
    fontWeight: '900',
    letterSpacing: '-0.05em',
    color: 'var(--on-surface)'
  },
  brandSubtitle: {
    fontSize: '0.625rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--outline)',
    marginTop: '0.25rem',
    fontWeight: '700'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--on-surface-variant)',
    cursor: 'pointer',
    padding: '0.5rem'
  },
  sidebarNav: {
    flex: 1,
    padding: '0 0.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1.5rem',
    borderRadius: '9999px',
    textDecoration: 'none',
    color: 'var(--on-surface-variant)',
    fontSize: '0.875rem',
    fontWeight: '600',
    transition: 'all 0.2s'
  },
  navLinkActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1.5rem',
    borderRadius: '9999px',
    textDecoration: 'none',
    backgroundColor: '#f1f5f9',
    color: 'var(--primary)',
    fontSize: '0.875rem',
    fontWeight: '700',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  sidebarFooter: {
    padding: '0 1.5rem',
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  newServiceBtn: {
    width: '100%',
    padding: '1rem',
    color: 'white',
    border: 'none',
    borderRadius: '9999px',
    fontWeight: '700',
    fontSize: '0.875rem',
    marginBottom: '1rem',
    boxShadow: '0 10px 20px rgba(0, 85, 215, 0.2)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
  },
  footerLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    textDecoration: 'none',
    color: 'var(--on-surface-variant)',
    fontSize: '0.875rem',
    fontWeight: '600',
    marginBottom: '0.5rem'
  },
  adminProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    backgroundColor: 'var(--surface-container-lowest)',
    padding: '0.5rem',
    borderRadius: '9999px'
  },
  avatarWrap: {
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '50%',
    overflow: 'hidden'
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  profileText: {
    flex: 1
  },
  adminName: {
    fontSize: '0.75rem',
    fontWeight: '700',
    lineHeight: '1.2'
  },
  adminRole: {
    fontSize: '0.625rem',
    color: 'var(--on-surface-variant)',
    fontWeight: '500'
  },
  logoutBtn: {
    width: '2rem',
    height: '2rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--outline)',
    cursor: 'pointer'
  }
};

export default AdminSidebar;
