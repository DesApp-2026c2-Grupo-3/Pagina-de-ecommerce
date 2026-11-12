import React from 'react';

interface WaveHeaderLayoutProps {
  children?: React.ReactNode;
  className?: string;
}

export const WaveHeaderLayout: React.FC<WaveHeaderLayoutProps> = ({ 
  children, 
  className = "" 
}) => {
  
  return (
    
    // CONTENEDOR PRINCIPAL: Fondo crema base para el cuerpo de tu e-commerce
    <div className={`relative w-full min-h-screen bg-[#fdfbf7] text-neutral-900 overflow-x-hidden ${className}`}>
      {children}
      {/* 🔴 ENCABEZADO SUPERIOR: Aloja las olas horizontales fijas arriba */}
      <div className="absolute top-0 left-0 w-full h-24 pointer-events-none select-none z-0 overflow-hidden">
        <svg
          className="w-full h-full"
          viewBox="0 0 1440 100"
          xmlns="http://w3.org"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Degradados verticales: Van de color sólido arriba a transparente abajo */}
            <linearGradient id="red-dark-fade-bottom" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7f1d1d" stopOpacity="1" />
              <stop offset="65%" stopColor="#7f1d1d" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0" />
            </linearGradient>
            
            <linearGradient id="red-bright-fade-bottom" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#dc2626" stopOpacity="1" />
              <stop offset="60%" stopColor="#dc2626" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="black-fade-bottom" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0a0a0a" stopOpacity="1" />
              <stop offset="55%" stopColor="#0a0a0a" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#0a0a0a" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Capa 1: Fondo Rojo Oscuro en "S" Horizontal */}
          <path
            d="M0,0 L1440,0 L1440,40 
               C1080,75 720,10 360,65 
               C180,90 0,40 0,40 Z"
            fill="url(#red-dark-fade-bottom)"
          />
          {/* Capa 2: Rojo Vivo en "S" Horizontal */}
          <path
            d="M0,0 L1440,0 L1440,28 
               C1120,55 760,5 380,48 
               C200,68 0,28 0,28 Z"
            fill="url(#red-bright-fade-bottom)"
          />
          {/* Capa 3: Frente Negro en "S" Horizontal */}
          <path
            d="M0,0 L1440,0 L1440,16 
               C1150,38 800,0 400,32 
               C220,48 0,16 0,16 Z"
            fill="url(#black-fade-bottom)"
          />
        </svg>
      </div>

      {/* 💻 CAPA DE CONTENIDO: Queda libre por encima */}
      
    </div>
  );
  
};

export default WaveHeaderLayout;