import React from 'react';

const ProgressBar = ({ progress = 0 }) => {
  const safeProgress = Math.min(100, Math.max(0, progress));

  return (
    <div style={styles.container}>
      <div style={{ ...styles.fill, width: `${safeProgress}%` }} />
    </div>
  );
};

const styles = {
  container: {
    height: '8px',
    width: '100%',
    backgroundColor: 'var(--border-color)',
    borderRadius: 'var(--radius-full)',
    overflow: 'hidden'
  },
  fill: {
    height: '100%',
    background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
    borderRadius: 'var(--radius-full)',
    transition: 'width 0.5s ease-in-out'
  }
};

export default ProgressBar;
