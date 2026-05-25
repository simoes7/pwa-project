import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';
import { useAuth } from '../context/AuthContext';

const getInitials = (name) => {
  if (!name) return 'AD';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

const AdminTopBar = ({ searchQuery, setSearchQuery, placeholder = "Search...", onMenuClick }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

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
            placeholder={placeholder || t('common.search')} 
            style={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div style={styles.appBarActions}>
        <button
          onClick={() => navigate('/')}
          style={styles.homeBtn}
          title="Go to Home"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.375rem', fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>home</span>
        </button>
        <LanguageSwitcher />
        <button style={styles.iconBtn} className="hide-tablet">
          <span className="material-symbols-outlined">notifications</span>
          <span style={styles.notificationDot}></span>
        </button>
        <button style={styles.iconBtn} className="hide-tablet">
          <span className="material-symbols-outlined">help_outline</span>
        </button>
        <div style={styles.userSection}>
          <div style={styles.userInfo} className="hide-tablet">
            <p style={styles.userName}>{user?.name || 'Admin User'}</p>
            <p style={styles.userRole}>Systems Director</p>
          </div>
          <div style={styles.avatarCircle}>
            {getInitials(user?.name || 'Admin User')}
          </div>
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
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderBottom: '1px solid var(--surface-container-high)',
    backdropFilter: 'blur(24px)',
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
    border: '1px solid rgba(148, 180, 224, 0.25)',
    padding: '0.625rem 1.25rem',
    borderRadius: '9999px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 2px 8px rgba(13, 52, 89, 0.01)',
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
    color: 'var(--on-surface)',
    fontWeight: '600'
  },
  appBarActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem'
  },
  homeBtn: {
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#475569',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'var(--surface-container-low)',
      color: 'var(--primary)'
    }
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
    position: 'relative',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'var(--surface-container-low)',
      color: 'var(--primary)'
    }
  },
  notificationDot: {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    width: '8px',
    height: '8px',
    backgroundColor: 'var(--error)',
    borderRadius: '50%',
    border: '2px solid white'
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.375rem 0.5rem 0.375rem 1rem',
    backgroundColor: 'var(--surface-container-lowest)',
    border: '1px solid var(--surface-container-high)',
    borderRadius: '9999px',
    boxShadow: '0 4px 12px rgba(13, 52, 89, 0.02)',
  },
  userInfo: {
    textAlign: 'right'
  },
  userName: {
    fontSize: '0.825rem',
    fontWeight: '800',
    lineHeight: '1.2',
    color: 'var(--on-surface)'
  },
  userRole: {
    fontSize: '0.675rem',
    color: 'var(--primary)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginTop: '0.125rem'
  },
  avatarCircle: {
    width: '2rem',
    height: '2rem',
    borderRadius: '50%',
    backgroundColor: 'var(--primary)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    fontSize: '0.75rem',
    boxShadow: '0 2px 6px rgba(0, 85, 215, 0.15)'
  }
};

export default AdminTopBar;
