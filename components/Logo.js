
import React from 'react';

const Logo = () => {
  return (
    <svg width="120" height="45" viewBox="0 0 400 150" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="loopGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2E8DE6"/>
          <stop offset="100%" stopColor="#A43DDB"/>
        </linearGradient>
      </defs>
      <circle cx="75" cy="75" r="50" fill="none" stroke="url(#loopGradient)" strokeWidth="8"/>
      <path d="M50,75 Q75,55 100,75" fill="none" stroke="#A43DDB" strokeWidth="3" opacity="0.6"/>
      <path d="M50,85 Q75,65 100,85" fill="none" stroke="#2E8DE6" strokeWidth="3" opacity="0.6"/>
      <text x="150" y="90" fontFamily="Poppins, sans-serif" fontSize="48" fill="#e2e8f0" textAnchor="start">
        loop live
      </text>
    </svg>
  );
};

export default Logo;
