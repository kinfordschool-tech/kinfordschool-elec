import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export default function KinfordLogo({ className = 'h-10 w-10', size = 40 }: LogoProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Shield with Gold Accent */}
      <path
        d="M50 5L85 20V50C85 72.5 68 89.5 50 95C32 89.5 15 72.5 15 50V20L50 5Z"
        fill="url(#shieldGradient)"
        stroke="#E2E8F0"
        strokeWidth="1.5"
      />
      {/* Decorative Gold Inner Shield Line */}
      <path
        d="M50 11L79 23.5V49C79 67.5 66 82 50 87C34 82 21 67.5 21 49V23.5L50 11Z"
        stroke="#F59E0B"
        strokeWidth="1.5"
        strokeDasharray="2 2"
        fill="none"
        opacity="0.8"
      />
      {/* School Crest Symbol - Letter 'K' and Stars */}
      <g transform="translate(10, 10) scale(0.8)">
        {/* Letter 'K' in gold */}
        <path
          d="M35 25H43V75H35V25ZM63 25H72L50 50L72 75H63L43 52.5V75H35V25H43V47.5L63 25Z"
          fill="#F59E0B"
        />
        {/* Small stars */}
        <path d="M50 15L51.5 18.5L55 19L52.5 21.5L53 25L50 23L47 25L47.5 21.5L45 19L48.5 18.5L50 15Z" fill="#F8FAF4" />
      </g>
      <defs>
        <linearGradient id="shieldGradient" x1="50" y1="5" x2="50" y2="95" gradientUnits="userSpaceOnUse">
          <stop stopColor="#312E81" /> {/* Indigo 900 */}
          <stop offset="1" stopColor="#1E1B4B" /> {/* Indigo 950 */}
        </linearGradient>
      </defs>
    </svg>
  );
}
