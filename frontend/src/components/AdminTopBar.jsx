import React from 'react';
import { useAuth } from '../context/AuthContext';

const AdminTopBar = ({ searchQuery, setSearchQuery, placeholder = "Search...", onMenuClick }) => {
  const { user } = useAuth();

  return (
    <header style={styles.topAppBar}>
      <div style={styles.leftSection}>
        <button 
          className="show-mobile" 
          style={styles.menuBtn}
          onClick={onMenuClick}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        
        <div style={styles.searchContainer} className="hide-on-xsmall">
          <span className="material-symbols-outlined" style={styles.searchIcon}>search</span>
          <input 
            type="text" 
            placeholder={placeholder} 
            style={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div style={styles.appBarActions}>
        <button style={styles.iconBtn} className="hide-tablet">
          <span className="material-symbols-outlined">notifications</span>
          <span style={styles.notificationDot}></span>
        </button>
        <button style={styles.iconBtn} className="hide-tablet">
          <span className="material-symbols-outlined">contrast</span>
        </button>
        <div style={styles.userSection}>
          <div style={styles.userInfo} className="hide-tablet">
            <p style={styles.userName}>{user?.name || 'Admin User'}</p>
            <p style={styles.userRole}>Systems Director</p>
          </div>
          <img 
            src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=100&h=100&auto=format&fit=crop" 
            alt="Profile" 
            style={styles.userAvatar}
          />
        </div>
      </div>
    </header>
  );
};

const styles = {
  topAppBar: {
    height: '80px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    position: 'sticky',
    top: 0,
    backgroundColor: 'rgba(248, 249, 255, 0.8)',
    backdropFilter: 'blur(20px)',
    zIndex: 900
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flex: 1
  },
  menuBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--on-surface)',
    cursor: 'pointer',
    padding: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--surface-container-low)',
    padding: '0.625rem 1rem',
    borderRadius: '9999px',
    width: '100%',
    maxWidth: '400px'
  },
  searchIcon: {
    color: 'var(--on-surface-variant)',
    marginRight: '0.75rem',
    fontSize: '20px'
  },
  searchInput: {
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '0.875rem',
    outline: 'none',
    flex: 1,
    color: 'var(--on-surface)'
  },
  appBarActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem'
  },
  iconBtn: {
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--on-surface-variant)',
    position: 'relative'
  },
  notificationDot: {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    width: '8px',
    height: '8px',
    backgroundColor: 'var(--error)',
    borderRadius: '50%',
    border: '2px solid var(--background)'
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    paddingLeft: '1.5rem',
    borderLeft: '1px solid var(--surface-container-low)'
  },
  userInfo: {
    textAlign: 'right'
  },
  userName: {
    fontSize: '0.875rem',
    fontWeight: '800',
    lineHeight: '1.2'
  },
  userRole: {
    fontSize: '0.75rem',
    color: 'var(--on-surface-variant)',
    fontWeight: '500'
  },
  userAvatar: {
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid var(--primary-container)'
  }
};

export default AdminTopBar;
