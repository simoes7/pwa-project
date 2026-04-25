import React from 'react';

const Logo = ({ className = "w-8 h-8" }) => (
  <svg 
    viewBox="0 0 120 120" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    fill="none"
  >
    <defs>
      <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
    </defs>
    
    <path 
      d="M 40 25 L 80 25 A 18 18 0 0 1 80 61 L 30 61 A 24 24 0 0 0 30 109 L 90 109 A 24 24 0 0 0 114 85" 
      stroke="url(#logo-gradient)" 
      strokeWidth="14" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    
    <circle cx="45" cy="75" r="5" fill="url(#logo-gradient)" />
    <rect x="39" y="83" width="12" height="19" rx="4" fill="url(#logo-gradient)" />
    
    <circle cx="60" cy="75" r="5" fill="url(#logo-gradient)" />
    <rect x="54" y="83" width="12" height="19" rx="4" fill="url(#logo-gradient)" />
    
    <circle cx="75" cy="75" r="5" fill="url(#logo-gradient)" />
    <rect x="69" y="83" width="12" height="19" rx="4" fill="url(#logo-gradient)" />
  </svg>
);

export default Logo;
