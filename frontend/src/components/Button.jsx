import React from 'react';

const Button = ({ children, variant = 'primary', size = 'md', style = {}, disabled = false, ...props }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: 'transparent',
          color: 'var(--primary)',
        };
      case 'dark':
        return {
          backgroundColor: 'var(--accent)',
          color: '#ffffff',
          boxShadow: '0 4px 14px 0 rgba(17, 40, 75, 0.25)',
        };
      case 'light':
        return {
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          color: 'var(--primary)',
        };
      case 'danger-light':
        return {
          backgroundColor: 'var(--danger-light)',
          color: 'var(--danger)',
        };
      case 'danger':
        return {
          backgroundColor: 'var(--danger)',
          color: '#ffffff',
        };
      case 'primary':
      default:
        return {
          background: 'var(--gradient-main)',
          color: '#ffffff',
          boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.25)',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'lg':
        return {
          padding: '1rem 2rem',
          fontSize: '1.125rem',
          borderRadius: 'var(--radius-full)',
        };
      case 'sm':
        return {
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
          borderRadius: 'var(--radius-full)',
        };
      case 'md':
      default:
        return {
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          borderRadius: 'var(--radius-full)',
        };
    }
  };

  const baseStyle = {
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    ...getSizeStyles(),
    ...getVariantStyles(),
    ...style,
  };

  return (
    <button 
      style={baseStyle} 
      disabled={disabled} 
      onMouseEnter={(e) => {
        if (!disabled && variant !== 'secondary') {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.filter = 'brightness(1.05)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && variant !== 'secondary') {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.filter = 'none';
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
