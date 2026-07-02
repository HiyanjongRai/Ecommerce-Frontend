import React from 'react';

const SellingIllustration = ({ className = "w-full max-w-[280px]" }) => {
  return (
    <svg 
      viewBox="0 0 500 400" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Background soft glowing circle */}
      <circle cx="250" cy="200" r="150" fill="url(#circleGlow)" />

      {/* Grid lines in background */}
      <path d="M150 200 H350 M150 250 H350 M150 150 H350 M200 100 V300 M250 100 V300 M300 100 V300" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />

      {/* Main dashboard panel representing metrics */}
      <rect x="130" y="110" width="240" height="180" rx="16" fill="white" stroke="#E5E7EB" strokeWidth="2" filter="url(#shadow)" />
      
      {/* Dashboard Top bar */}
      <rect x="146" y="126" width="60" height="12" rx="6" fill="#DCFCE7" />
      <rect x="314" y="126" width="40" height="12" rx="6" fill="#F3F4F6" />

      {/* Analytics chart inside dashboard */}
      <path 
        d="M150 240 Q 190 190, 230 220 T 310 160 T 350 150" 
        stroke="#16A34A" 
        strokeWidth="4" 
        strokeLinecap="round" 
      />
      
      {/* Dots on chart path */}
      <circle cx="230" cy="220" r="6" fill="white" stroke="#16A34A" strokeWidth="3" />
      <circle cx="310" cy="160" r="6" fill="white" stroke="#16A34A" strokeWidth="3" />

      {/* Growth arrow indicator */}
      <path d="M330 135 H350 V155" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

      {/* Floating sales elements */}
      {/* 1. Small badge representing customer count */}
      <g filter="url(#smallShadow)">
        <rect x="80" y="210" width="110" height="50" rx="12" fill="white" />
        <circle cx="106" cy="235" r="14" fill="#DCFCE7" />
        {/* User avatar SVG inside circle */}
        <path d="M101 241 C101 237 104 235 106 235 C108 235 111 237 111 241" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
        <circle cx="106" cy="230" r="3" stroke="#16A34A" strokeWidth="2" />
        <rect x="128" y="226" width="46" height="8" rx="4" fill="#111827" />
        <rect x="128" y="238" width="28" height="6" rx="3" fill="#6B7280" />
      </g>

      {/* 2. Small badge representing a secure payment (Rs / Wallet icon) */}
      <g filter="url(#smallShadow)">
        <rect x="310" y="220" width="120" height="50" rx="12" fill="white" />
        <circle cx="336" cy="245" r="14" fill="#DCFCE7" />
        {/* Currency / cash symbol */}
        <path d="M331 245 H341 M336 240 V250 M333 241 L339 249" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
        <rect x="358" y="236" width="56" height="8" rx="4" fill="#111827" />
        <rect x="358" y="248" width="36" height="6" rx="3" fill="#6B7280" />
      </g>

      {/* 3. Floating Box representing delivery/shipment */}
      <g filter="url(#smallShadow)">
        <rect x="200" y="60" width="100" height="40" rx="10" fill="white" />
        <path d="M214 80 L220 74 H228 L234 80 V88 H214 V80 Z" stroke="#16A34A" strokeWidth="2" strokeLinejoin="round" />
        <line x1="220" y1="74" x2="220" y2="88" stroke="#16A34A" strokeWidth="1.5" />
        <rect x="242" y="72" width="46" height="6" rx="3" fill="#111827" />
        <rect x="242" y="81" width="30" height="5" rx="2.5" fill="#16A34A" />
      </g>

      {/* Definitions for gradients and shadows */}
      <defs>
        <radialGradient id="circleGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#DCFCE7" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#F8FAFC" stopOpacity="0" />
        </radialGradient>
        
        <filter id="shadow" x="110" y="95" width="280" height="220" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#16A34A" floodOpacity="0.04" />
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#111827" floodOpacity="0.02" />
        </filter>

        <filter id="smallShadow" x="70" y="50" width="380" height="240" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#111827" floodOpacity="0.04" />
        </filter>
      </defs>
    </svg>
  );
};

export default SellingIllustration;
