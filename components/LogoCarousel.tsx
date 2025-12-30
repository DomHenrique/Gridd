import React from 'react';
import { BRAND } from '../constants';

const logos = [
  { name: 'NexGen', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  )},
  { name: 'Lumina', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )},
  { name: 'Velox', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )},
  { name: 'Prime', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )},
  { name: 'Syncro', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )},
  { name: 'Aura', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )},
  { name: 'Quantum', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )},
  { name: 'EcoSystems', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C10 14.52 12 12 13 9" />
    </svg>
  )},
];

export const LogoCarousel: React.FC = () => {
  return (
    <div className="logo-carousel-container py-5 overflow-hidden border-bottom border-top" style={{ backgroundColor: '#ffffff' }}>
      <div className="logo-carousel-track d-flex gap-5 px-3">
        {/* Original */}
        {logos.map((logo, i) => (
          <div key={`orig-${i}`} className="logo-item d-flex align-items-center gap-3 text-secondary opacity-75 transition-all cursor-pointer">
            <div style={{ color: BRAND.primaryColor }}>{logo.icon}</div>
            <span className="fw-bold text-uppercase small ls-wider" style={{ color: BRAND.secondaryColor }}>{logo.name}</span>
          </div>
        ))}
        {/* Duplicate 1 */}
        {logos.map((logo, i) => (
          <div key={`dup1-${i}`} aria-hidden="true" className="logo-item d-flex align-items-center gap-3 text-secondary opacity-75 transition-all cursor-pointer">
            <div style={{ color: BRAND.primaryColor }}>{logo.icon}</div>
            <span className="fw-bold text-uppercase small ls-wider" style={{ color: BRAND.secondaryColor }}>{logo.name}</span>
          </div>
        ))}
        {/* Duplicate 2 */}
        {logos.map((logo, i) => (
          <div key={`dup2-${i}`} aria-hidden="true" className="logo-item d-flex align-items-center gap-3 text-secondary opacity-75 transition-all cursor-pointer">
            <div style={{ color: BRAND.primaryColor }}>{logo.icon}</div>
            <span className="fw-bold text-uppercase small ls-wider" style={{ color: BRAND.secondaryColor }}>{logo.name}</span>
          </div>
        ))}
      </div>

      <style>{`
        .logo-carousel-container {
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }

        .logo-carousel-track {
          width: fit-content;
          animation: slide-right 40s linear infinite;
        }

        .logo-item {
          flex-shrink: 0;
          white-space: nowrap;
          transition: all 0.3s ease;
        }

        .grayscale {
          filter: grayscale(100%);
        }

        .hover-grayscale-0:hover {
          filter: grayscale(0%);
          opacity: 1 !important;
          color: #000 !important;
        }

        .ls-wider {
          letter-spacing: 0.1em;
        }

        @keyframes slide-right {
          from {
            transform: translateX(-50%);
          }
          to {
            transform: translateX(0);
          }
        }

        /* Adjust animation for smoother loop on smaller screens */
        @media (max-width: 768px) {
          .logo-carousel-track {
            animation-duration: 25s;
          }
        }
      `}</style>
    </div>
  );
};
