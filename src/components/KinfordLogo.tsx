import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export default function KinfordLogo({ className = '', size = 40, showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-3.5 ${className}`}>
      {/* Logo Crest (Icon only) */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Gold Bar */}
        <rect x="25" y="18" width="50" height="15" fill="#EEB540" />
        {/* Maroon Arch */}
        <path d="M25,76 L25,52 Q50,28 75,52 L75,76 Q50,51 25,76 Z" fill="#A22538" />
      </svg>
      
      {/* Wordmark (Text) */}
      {showText && (
        <div className="flex flex-col justify-center select-none">
          <span className="font-black text-white tracking-widest text-xl leading-none">
            KINFORD
          </span>
          <span className="text-[8px] text-slate-300 font-bold tracking-[0.2em] leading-none mt-1.5 uppercase">
            SCHOOL OF GUIDANCE
          </span>
        </div>
      )}
    </div>
  );
}
