import React from 'react';

const Card = ({ children, style = {}, className = '', ...props }) => {
  return (
    <div 
      className={`glass-card ${className}`} 
      style={{ padding: '1.5rem', backgroundColor: 'var(--card-bg)', ...style }} 
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
