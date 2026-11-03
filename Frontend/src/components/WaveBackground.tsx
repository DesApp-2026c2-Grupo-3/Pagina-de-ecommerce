import React from 'react';

interface WaveSectionDividerProps {
  children?: React.ReactNode;
  className?: string;
}

export const WaveSectionDivider: React.FC<WaveSectionDividerProps> = ({ children, className = "" }) => {
  return (
    // Contenedor padre relativo. Se adapta al tamaño de lo que pongas dentro.
    <div className={`relative w-full bg-neutral-950 text-white ${className}`}>
      
      {/* CAPA DE CONTENIDO: Tus textos o imágenes van aquí arriba */}
      <div className="relative z-10 w-full">
        {children}
      </div>

      {/* FRANJA DE OLAS AL FONDO (Altura fija de 144px para dar espacio a las crestas) */}
      <div className="absolute bottom-0 left-0 w-full h-36 pointer-events-none select-none z-0 overflow-hidden">
        <svg
          className="w-full h-full"
          viewBox="0 0 1440 200"
          xmlns="http://w3.org"
          preserveAspectRatio="none"
        >
          {/* Onda 1: Fondo - Rojo Oscuro / Carmesí */}
          <path
            d="M0,60 C240,140 480,10 720,90 C960,170 1200,30 1440,80 L1440,200 L0,200 Z"
            fill="#7f1d1d" /* Tailwind red-900 */
            opacity="0.6"
          />
          
          {/* Onda 2: Intermedia - Rojo Vivo Eléctrico */}
          <path
            d="M0,110 C180,30 360,160 640,70 C920,-20 1180,140 1440,40 L1440,200 L0,200 Z"
            fill="#dc2626" /* Tailwind red-600 */
            opacity="0.8"
          />

          {/* Onda 3: Capa Negra Profunda (Corta las rojas creando siluetas de olas) */}
          <path
            d="M0,130 C300,60 540,160 840,90 C1140,20 1300,140 1440,110 L1440,200 L0,200 Z"
            fill="#0a0a0a" /* Tailwind neutral-950 oscuro */
          />

          {/* Onda 4: Frente - Negro Absoluto para sellar la base */}
          <path
            d="M0,160 C200,120 450,180 700,140 C950,100 1200,170 1440,150 L1440,200 L0,200 Z"
            fill="#000000"
          />
        </svg>
      </div>
    </div>
  );
};

export default WaveSectionDivider;
