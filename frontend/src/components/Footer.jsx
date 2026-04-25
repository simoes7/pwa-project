import React from 'react';
import Logo from './Logo';

const Footer = () => {
  return (
    <footer style={styles.footer}>
      <div className="footer-inner" style={styles.inner}>
        <div style={styles.logoCol}>
          <Logo className="w-6 h-6 grayscale opacity-50" />
          <span className="headline" style={styles.logoText}>Smart Queue</span>
        </div>
        
        <div style={styles.linksCol}>
          <a href="#" style={styles.link}>Privacy</a>
          <a href="#" style={styles.link}>Terms</a>
          <a href="#" style={styles.link}>API Docs</a>
          <a href="#" style={styles.link}>Contact</a>
        </div>
        
        <div style={styles.copyCol}>
          <p style={styles.copyText}>© 2024 Smart Queue. Flowing with ease.</p>
        </div>
      </div>
    </footer>
  );
};

const styles = {
  footer: {
    padding: '5rem 2rem 3rem',
    backgroundColor: '#f8fafc',
    borderTop: '1px solid #e2e8f0',
    marginTop: 'auto'
  },
  inner: {
    maxWidth: '1280px',
    margin: '0 auto',
  },
  logoCol: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  logoText: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: '-0.02em'
  },
  linksCol: {
    display: 'flex',
    gap: '2rem'
  },
  link: {
    color: '#64748b',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    textDecoration: 'none',
    transition: 'color 0.2s'
  },
  copyText: {
    color: '#94a3b8',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.1em'
  }
};

export default Footer;
