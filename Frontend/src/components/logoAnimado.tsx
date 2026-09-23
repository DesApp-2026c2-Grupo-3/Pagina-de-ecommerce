import React, { useState, useEffect } from 'react';
import logo from '../assets/logoX.png'; 

export const LogoAnimadoVelocidad: React.FC = () => {
  // Estado para controlar si el efecto de velocidad está activo o ya frenó
  // Inicia en true para que se ejecute automáticamente cada vez que el componente se monte/renderice
  const [animando, setAnimando] = useState(true);

  useEffect(() => {
    // Cuando entras a la sección, te logueas o abres la página, 
    // mantiene la estela estirada por 1 segundo (1000ms) y luego frena.
    const timer = setTimeout(() => {
      setAnimando(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []); // El array vacío asegura que se dispare exactamente al renderizarse por primera vez

  // Configuramos los ecos. Si 'animando' es true, se estiran con los valores X altos que definiste.
  // Si es false, van a X: 0 escondiéndose perfectamente detrás del logo principal nítido.
  const ecos = [
    { x: animando ? 300 : 0, opacity: animando ? 0.10 : 0, filter: 'hue-rotate(180deg) brightness(1.6) blur(2px)' }, 
    { x: animando ? 200 : 0, opacity: animando ? 0.25 : 0, filter: 'hue-rotate(240deg) brightness(1.4)' }, 
    { x: animando ? 100 : 0, opacity: animando ? 0.45 : 0, filter: 'hue-rotate(300deg) brightness(1.3)' }, 
    { x: animando ? 50 : 0, opacity: animando ? 0.70 : 0, filter: 'hue-rotate(0deg) saturate(1.5)' },       
    { x: 0,                  opacity: 1.00,                filter: 'none' } // El logo original al frente
  ];

  return (
    <div className="flex-1 flex justify-center overflow-hidden py-4">
      {/* SE AMPLÍA EL ANCHO A w-[650px]: Evita que la enorme estela de 400px se corte en los bordes */}
      {/* Además, añadimos un pequeño desplazamiento físico global (translate-x) al contenedor */}
      {/* para simular que el bloque completo viene con inercia y se detiene en su sitio */}
      <div 
        className={`relative h-24 w-[650px] transition-transform duration-1000 transform ${
          animando ? 'translate-x-16' : 'translate-x-0'
        }`}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.1, 0.8, 0.3, 1)'
        }}
      > 
        {ecos.map((eco, index) => (
          <img 
            key={index}
            src={logo} 
            alt="Logotipo con animación de velocidad" 
            className="h-24 w-auto object-cover absolute top-0 will-change-transform" 
            style={{
              left: `${eco.x}px`,
              opacity: eco.opacity,
              filter: eco.filter,
              mixBlendMode: 'screen', // Fusión cromática ideal sobre fondos oscuros
              /* Tu curva de transición original (resorte) para un frenado y desvanecimiento fluidos */
              transition: 'left 0.8s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.6s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
};
