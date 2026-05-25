import React, { useEffect, useRef } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationDropdown = ({ isOpen, onClose }) => {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      // If click is outside the dropdown and outside the notification button
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        if (!e.target.closest('.nav-notification-btn')) {
          onClose();
        }
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <motion.div 
      ref={dropdownRef}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      style={styles.dropdown} 
      className="ethereal-blur"
    >
      <div style={styles.header}>
        <h3 style={styles.title}>Notifications</h3>
        {notifications.length > 0 && (
          <button style={styles.markAllBtn} onClick={markAllAsRead}>
            Mark all as read
          </button>
        )}
      </div>

      <div style={styles.list}>
        <AnimatePresence>
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <motion.div 
                key={n.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`notification-item ${n.is_read ? '' : 'unread'}`}
                onClick={() => !n.is_read && markAsRead(n.id)}
              >
                <div style={{
                  ...styles.iconContainer,
                  backgroundColor: n.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : n.type === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(0, 85, 215, 0.1)'
                }}>
                  <span className="material-symbols-outlined" style={{
                    ...styles.icon,
                    color: n.type === 'success' ? '#10b981' : n.type === 'warning' ? '#f59e0b' : 'var(--primary)'
                  }}>
                    {n.type === 'success' ? 'check_circle' : n.type === 'warning' ? 'warning' : 'notifications'}
                  </span>
                </div>
                <div style={styles.content}>
                  <p style={styles.itemTitle}>{n.title}</p>
                  <p style={styles.itemMessage}>{n.message}</p>
                  <p style={styles.itemTime}>
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
                {!n.is_read && <div style={styles.unreadDot}></div>}
              </motion.div>
            ))
          ) : (
            <div style={styles.emptyState}>
              <span className="material-symbols-outlined" style={styles.emptyIcon}>notifications_off</span>
              <p>No notifications yet</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const styles = {
  dropdown: {
    position: 'absolute',
    top: '80px',
    right: '2rem',
    width: '350px',
    maxHeight: '480px',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: '1.5rem',
    boxShadow: '0 20px 40px rgba(13, 52, 89, 0.12)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    zIndex: 1001, // Higher than navbar contents so it floats cleanly
  },
  header: {
    padding: '1.25rem 1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(0,0,0,0.05)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)'
  },
  title: {
    fontSize: '1.125rem',
    fontWeight: '800',
    color: 'var(--on-surface)',
    margin: 0
  },
  markAllBtn: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: 'var(--primary)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.5rem',
    transition: 'background 0.2s'
  },
  list: {
    overflowY: 'auto',
    flex: 1
  },
  iconContainer: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  icon: {
    fontSize: '1.25rem'
  },
  content: {
    flex: 1
  },
  itemTitle: {
    fontSize: '0.9375rem',
    fontWeight: '700',
    color: 'var(--on-surface)',
    margin: '0 0 0.25rem 0'
  },
  itemMessage: {
    fontSize: '0.8125rem',
    color: 'var(--on-surface-variant)',
    margin: '0 0 0.5rem 0',
    lineHeight: '1.4'
  },
  itemTime: {
    fontSize: '0.75rem',
    color: 'var(--outline)',
    margin: 0
  },
  unreadDot: {
    width: '8px',
    height: '8px',
    backgroundColor: 'var(--primary)',
    borderRadius: '50%',
    position: 'absolute',
    right: '1.5rem',
    top: '1.5rem'
  },
  emptyState: {
    padding: '3rem 2rem',
    textAlign: 'center',
    color: 'var(--on-surface-variant)'
  },
  emptyIcon: {
    fontSize: '3rem',
    opacity: 0.2,
    marginBottom: '1rem'
  }
};

export default NotificationDropdown;
