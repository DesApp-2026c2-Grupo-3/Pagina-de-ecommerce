import React from 'react';

interface WaveVerticalPanelsProps {
  children?: React.ReactNode;
  className?: string;
  isFixed?: boolean;
  iluminarMitadSuperior?: boolean;
}

export const WaveVerticalPanels: React.FC<WaveVerticalPanelsProps> = ({ 
  children, 
  className = "", 
  isFixed = true,
  iluminarMitadSuperior = false,
}) => {
  const positionClass = isFixed ? "fixed" : "absolute";

  return (
    <div className={`relative w-full min-h-screen bg-[#fdfbf7] text-neutral-900 overflow-x-hidden ${className}`}>
      
      {/* PANEL IZQUIERDO */}
      <div className={`${positionClass} top-0 left-0 h-full w-20 sm:w-28 lg:w-20 xl:w-28 pointer-events-none select-none z-10 overflow-hidden`}>
        
        {/* CAPA BASE CLÁSICA (Siempre presente) */}
        <svg
          className="w-full h-full"
          viewBox="0 0 100 1440"
          xmlns="http://w3.org"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="red-dark-fade-right" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7f1d1d" stopOpacity="1" />
              <stop offset="70%" stopColor="#7f1d1d" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="red-bright-fade-right" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#dc2626" stopOpacity="1" />
              <stop offset="65%" stopColor="#dc2626" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="black-fade-right" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0a0a0a" stopOpacity="1" />
              <stop offset="60%" stopColor="#0a0a0a" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#0a0a0a" stopOpacity="0" />
            </linearGradient>
          </defs>

          <path d="M0,0 L45,0 C70,120 15,240 45,360 C70,480 15,600 45,720 C70,840 15,960 45,1080 C70,1200 15,1320 45,1440 L0,1440 Z" fill="url(#red-dark-fade-right)" />
          <path d="M0,0 L32,0 C55,90 8,180 32,270 C55,360 8,450 32,540 C55,630 8,720 32,810 C55,900 8,990 32,1080 C55,1170 8,1260 32,1350 C55,1440 8,1440 28,1440 L0,1440 Z" fill="url(#red-bright-fade-right)" />
          <path d="M0,0 L18,0 C35,120 2,240 18,360 C35,480 2,600 18,720 C35,840 2,960 18,1080 C35,1200 2,1320 18,1440 L0,1440 Z" fill="url(#black-fade-right)" />
        </svg>

        {/* CAPA DE AURORA VERDE FLUORESCENTE CON CUERPO HASTA EL TECHO (Izquierda) */}
        {iluminarMitadSuperior && (
          <svg
            className="block lg:hidden absolute top-0 left-0 w-full h-full z-20"
            viewBox="0 0 100 1440"
            xmlns="http://w3.org"
            preserveAspectRatio="none"
            style={{
              filter: 'drop-shadow(0 0 16px #10b981)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 74%)',
              maskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 74%)',
            }}
          >
            <defs>
              <linearGradient id="g-verde-1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#059669" stopOpacity="1" />
                <stop offset="75%" stopColor="#10b981" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="g-verde-2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#34d399" stopOpacity="1" />
                <stop offset="75%" stopColor="#6ee7b7" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#a7f3d0" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="g-verde-3" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ecfdf5" stopOpacity="1" />
                <stop offset="75%" stopColor="#a7f3d0" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#6ee7b7" stopOpacity="0" />
              </linearGradient>
            </defs>

            <path d="M0,0 L58,0 C75,120 20,240 48,360 C72,480 18,600 45,720 C70,840 15,960 45,1080 C70,1200 15,1320 45,1440 L0,1440 Z" fill="url(#g-verde-1)" />
            <path d="M0,0 L42,0 C60,90 12,180 35,270 C55,360 10,450 32,540 C55,630 8,720 32,810 C55,900 8,990 32,1080 C55,1170 8,1260 32,1350 C55,1440 8,1440 28,1440 L0,1440 Z" fill="url(#g-verde-2)" />
            <path d="M0,0 L28,0 C42,120 6,240 20,360 C35,480 4,600 18,720 C35,840 2,960 18,1080 C35,1200 2,1320 18,1440 L0,1440 Z" fill="url(#g-verde-3)" />
          </svg>
        )}
      </div>
      {/* PANEL DERECHO */}
      <div className={`${positionClass} top-0 right-0 h-full w-20 sm:w-28 lg:w-20 xl:w-28 pointer-events-none select-none z-10 overflow-hidden`}>
        
        {/* CAPA BASE CLÁSICA */}
        <svg
          className="w-full h-full"
          viewBox="0 0 100 1440"
          xmlns="http://w3.org"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="red-dark-fade-left" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#7f1d1d" stopOpacity="1" />
              <stop offset="70%" stopColor="#7f1d1d" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="red-bright-fade-left" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#dc2626" stopOpacity="1" />
              <stop offset="65%" stopColor="#dc2626" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="black-fade-left" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#0a0a0a" stopOpacity="1" />
              <stop offset="60%" stopColor="#0a0a0a" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#0a0a0a" stopOpacity="0" />
            </linearGradient>
          </defs>

          <path d="M100,0 L55,0 C30,120 85,240 55,360 C30,480 85,600 55,720 C30,840 85,960 55,1080 C30,1200 85,1320 55,1440 L100,1440 Z" fill="url(#red-dark-fade-left)" />
          <path d="M100,0 L68,0 C45,90 92,180 68,270 C45,360 92,450 68,540 C45,630 92,720 68,810 C45,900 92,990 68,1080 C45,1170 92,1260 68,1350 C45,1440 92,1440 72,1440 L100,1440 Z" fill="url(#red-bright-fade-left)" />
          <path d="M100,0 L82,0 C65,120 98,240 82,360 C65,480 98,600 82,720 C65,840 98,960 82,1080 C65,1200 98,1320 82,1440 L100,1440 Z" fill="url(#black-fade-left)" />
        </svg>

        {/* CAPA DE AURORA VERDE FLUORESCENTE CON CUERPO HASTA EL TECHO (Derecha) */}
        {iluminarMitadSuperior && (
          <svg
            className="block lg:hidden absolute top-0 right-0 w-full h-full z-20"
            viewBox="0 0 100 1440"
            xmlns="http://w3.org"
            preserveAspectRatio="none"
            style={{
              filter: 'drop-shadow(0 0 16px #10b981)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 74%)',
              maskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 74%)',
            }}
          >
            <defs>
              <linearGradient id="g-verde-r1" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#059669" stopOpacity="1" />
                <stop offset="75%" stopColor="#10b981" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="g-verde-r2" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#34d399" stopOpacity="1" />
                <stop offset="75%" stopColor="#6ee7b7" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#a7f3d0" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="g-verde-r3" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#ecfdf5" stopOpacity="1" />
                <stop offset="75%" stopColor="#a7f3d0" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#6ee7b7" stopOpacity="0" />
              </linearGradient>
            </defs>

            <path d="M100,0 L42,0 C25,120 80,240 52,360 C28,480 82,600 55,720 C30,840 85,960 55,1080 C30,1200 85,1320 55,1440 L100,1440 Z" fill="url(#g-verde-r1)" />
            <path d="M100,0 L58,0 C40,90 88,180 65,270 C45,360 90,450 68,540 C45,630 92,720 68,810 C45,900 92,990 68,1080 C45,1170 92,1260 68,1350 C45,1440 92,1440 72,1440 L100,1440 Z" fill="url(#g-verde-r2)" />
            <path d="M100,0 L72,0 C58,120 94,240 80,360 C65,480 96,600 82,720 C65,840 98,960 82,1080 C65,1200 98,1320 82,1440 L100,1440 Z" fill="url(#g-verde-r3)" />
          </svg>
        )}
      </div>

      {/* CAPA DE CONTENIDO */}
      <div className="relative z-20 w-full min-h-screen px-6 sm:px-16 lg:px-12 xl:px-16">
        {children}
      </div>
      
    </div>
  );
};

export default WaveVerticalPanels;
