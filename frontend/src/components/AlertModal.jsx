import React from 'react';

const AlertModal = ({ isOpen, title, message, type = 'info', onConfirm, onClose }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success': return '#34A853';
      case 'error': return '#EA4335';
      case 'warning': return '#FBBC05';
      default: return 'var(--primary)';
    }
  };

  return (
    <div style={styles.overlay}>
      <div className="glass-card" style={styles.modal}>
        <div style={styles.header}>
          <span className="material-symbols-outlined" style={{ ...styles.icon, color: getIconColor() }}>
            {getIcon()}
          </span>
          <h2 className="headline" style={styles.title}>{title}</h2>
        </div>
        <div style={styles.content}>
          <p style={styles.message}>{message}</p>
        </div>
        <div style={styles.actions}>
          {onConfirm ? (
            <>
              <button onClick={onClose} style={styles.secondaryBtn}>Cancel</button>
              <button onClick={onConfirm} className="primary-gradient" style={styles.primaryBtn}>Confirm</button>
            </>
          ) : (
            <button onClick={onClose} className="primary-gradient" style={styles.primaryBtn}>OK</button>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(13, 52, 89, 0.4)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '1.5rem',
    animation: 'fadeIn 0.3s ease-out'
  },
  modal: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: '2rem',
    borderRadius: '1.5rem',
    boxShadow: '0 20px 60px rgba(13, 52, 89, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    transform: 'scale(1)',
    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    textAlign: 'center'
  },
  icon: {
    fontSize: '3rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: 'var(--on-surface)',
    margin: 0
  },
  content: {
    textAlign: 'center'
  },
  message: {
    fontSize: '1rem',
    color: 'var(--on-surface-variant)',
    lineHeight: '1.6',
    margin: 0
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center'
  },
  primaryBtn: {
    padding: '0.75rem 2rem',
    borderRadius: '0.75rem',
    border: 'none',
    color: 'white',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'transform 0.2s'
  },
  secondaryBtn: {
    padding: '0.75rem 1.5rem',
    borderRadius: '0.75rem',
    border: '1px solid var(--outline-variant)',
    backgroundColor: 'transparent',
    color: 'var(--on-surface)',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'background-color 0.2s'
  }
};

export default AlertModal;
