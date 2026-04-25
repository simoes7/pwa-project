import React from 'react';

const Badge = ({ status, style = {} }) => {
  const getStatusConfig = () => {
    switch (status?.toLowerCase()) {
      case 'called':
      case 'serving':
        return { bg: 'var(--success-light)', color: 'var(--success)', text: 'Serving' };
      case 'done':
        return { bg: 'var(--success-light)', color: 'var(--success)', text: 'Done' };
      case 'paused':
        return { bg: 'var(--warning-light)', color: 'var(--warning)', text: 'Paused' };
      case 'cancelled':
        return { bg: 'var(--danger-light)', color: 'var(--danger)', text: 'Cancelled' };
      case 'pending':
        return { bg: 'var(--info-light)', color: 'var(--primary)', text: 'Pending' };
      case 'priority':
        return { bg: 'var(--gradient-light)', color: 'var(--secondary)', text: 'Priority' };
      case 'fast-track':
        return { bg: 'var(--gradient-light)', color: 'var(--secondary)', text: 'Fast Track Available' };
      case 'waiting':
      default:
        return { bg: '#f1f5f9', color: 'var(--text-muted)', text: 'Waiting' };
    }
  };

  const config = getStatusConfig();

  return (
    <span style={{
      padding: '0.25rem 0.75rem',
      borderRadius: 'var(--radius-full)',
      fontSize: '0.7rem',
      fontWeight: '700',
      backgroundColor: config.bg,
      color: config.color,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      ...style
    }}>
      {config.text}
    </span>
  );
};

export default Badge;
