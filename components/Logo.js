import React from 'react';

const Logo = () => {
  return (
    <svg width="200" height="50" viewBox="0 0 360 80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366F1"/>
          <stop offset="50%" stopColor="#8B5CF6"/>
          <stop offset="100%" stopColor="#EC4899"/>
        </linearGradient>
        
        <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#EC4899"/>
          <stop offset="100%" stopColor="#8B5CF6"/>
        </linearGradient>
        
        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.1)"/>
        </filter>
      </defs>

      {/* Icon Section */}
      <g transform="translate(10 10)">
        {/* Main Circle */}
        <circle cx="30" cy="30" r="28" fill="none" stroke="url(#grad1)" strokeWidth="4"/>
        
        {/* Dynamic Lines */}
        <path d="M15 30 Q30 10 45 30" stroke="url(#grad2)" fill="none" strokeWidth="3" strokeLinecap="round"/>
        <path d="M20 40 Q30 20 40 40" stroke="url(#grad1)" fill="none" strokeWidth="3" strokeLinecap="round" opacity="0.8"/>
        
        {/* Central Dot */}
        <circle cx="30" cy="30" r="4" fill="url(#grad1)"/>
      </g>

      {/* Text Section */}
      <text x="80" y="50" fontFamily="'Inter', sans-serif" fontSize="35" fill="url(#grad1)" 
            fontWeight="600" letterSpacing="-1.5" filter="url(#shadow)">
        inspirelive
        <tspan fontSize="32" fill="#8B5CF6" dy="-8" dx="6"></tspan>
      </text>
    </svg>
  );
};

export default Logo;