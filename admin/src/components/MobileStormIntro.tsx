// src/components/MobileStormIntro.tsx
import React, { useState, useEffect, useCallback } from 'react';

interface MobileStormIntroProps {
  src: string;
  isAuthenticated?: boolean;
}

interface EcoConfig {
  x: number;
  opacity: number;
  filter: string;
  delay: string;
}

export const MobileStormIntro: React.FC<MobileStormIntroProps> = ({
  src,
  isAuthenticated = false,
}) => {
  const [rayoActivo, setRayoActivo] = useState(false);
  const [vibrando, setVibrando] = useState(false);
  const [logoPrecargado, setLogoPrecargado] = useState(false);

  // Precarga inmediata de la imagen
  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => setLogoPrecargado(true);
  }, [src]);

  const iniciarSecuenciaMobile = useCallback(() => {
    setRayoActivo(false);
    setVibrando(false);

    // 1. A los 450ms cae el rayo central sobre el logo gigante
    const tRayo = setTimeout(() => {
      setRayoActivo(true);
    }, 450);

    // 2. A los 850ms impacta: el logo vibra y se ilumina la cúpula con el destello
    const tImpacto = setTimeout(() => {
      setVibrando(true);
    }, 850);

    // 3. A los 1950ms termina el destello y la vibración
    const tFin = setTimeout(() => {
      setVibrando(false);
      setRayoActivo(false);
    }, 1950);

    return () => {
      clearTimeout(tRayo);
      clearTimeout(tImpacto);
      clearTimeout(tFin);
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated || !logoPrecargado) return;

    const limpiar = iniciarSecuenciaMobile();
    return () => limpiar();
  }, [isAuthenticated, logoPrecargado, iniciarSecuenciaMobile]);

  const ecos: EcoConfig[] = [
    { x: vibrando ? 36 : 0, opacity: vibrando ? 0.2 : 0, filter: 'hue-rotate(180deg) brightness(1.6) blur(1px)', delay: '0s' },
    { x: vibrando ? -22 : 0, opacity: vibrando ? 0.35 : 0, filter: 'hue-rotate(240deg) brightness(1.4)', delay: '0.1s' },
    { x: vibrando ? 12 : 0, opacity: vibrando ? 0.55 : 0, filter: 'hue-rotate(300deg) brightness(1.3)', delay: '0.05s' },
    { x: vibrando ? -12 : 0, opacity: vibrando ? 0.7 : 0, filter: 'hue-rotate(0deg) saturate(1.5)', delay: '0.15s' },
    { x: 0, opacity: 1.0, filter: 'none', delay: '0s' },
  ];

  return (
    <>
      <style>{`
        @keyframes vibrarGlitchMobile {
          0%   { transform: translate(0px, 0px); }
          20%  { transform: translate(calc(var(--max-x) * 0.8), calc(var(--max-x) * -0.2)); }
          40%  { transform: translate(calc(var(--max-x) * -0.5), calc(var(--max-x) * 0.3)); }
          60%  { transform: translate(calc(var(--max-x) * 0.9), calc(var(--max-x) * 0.1)); }
          80%  { transform: translate(calc(var(--max-x) * -0.3), calc(var(--max-x) * -0.4)); }
          100% { transform: translate(0px, 0px); }
        }

        @keyframes rayoMobileCentral {
          0%   { transform: translate(-50%, -50%) scaleY(0.1) scaleX(0.4); opacity: 0; }
          15%  { opacity: 1; transform: translate(-50%, -50%) scaleY(1.1) scaleX(1.1); }
          35%  { transform: translate(-50%, -50%) scaleY(1) scaleX(1); }
          100% { transform: translate(-50%, -50%) scaleY(1.25) scaleX(1.35); opacity: 0; }
        }

        @keyframes destelloCupulaMobile {
          0%   { opacity: 0; }
          12%  { opacity: 0.85; }
          30%  { opacity: 0.18; }
          50%  { opacity: 0.65; }
          75%  { opacity: 0.15; }
          100% { opacity: 0; }
        }

        .vibracion-mobile {
          animation: vibrarGlitchMobile 0.2s infinite linear;
        }

        .rayo-mobile {
          animation: rayoMobileCentral 0.95s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
          transform-origin: center center;
        }

        .flash-cupula-mobile {
          animation: destelloCupulaMobile 1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>
            {/* CIELO NOCTURNO ESTIRADO SUAVEMENTE PARA ABRAZAR LA CABECERA DEL FORMULARIO */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 h-[80vh] pointer-events-none z-0 overflow-hidden"
        style={{
          background: `
            linear-gradient(90deg, rgba(125, 211, 252, 0.48) 0%, rgba(56, 189, 248, 0.28) 9%, rgba(14, 165, 233, 0.08) 18%, transparent 26%, transparent 74%, rgba(14, 165, 233, 0.08) 82%, rgba(56, 189, 248, 0.28) 91%, rgba(125, 211, 252, 0.48) 100%),
            linear-gradient(180deg, #070a12 0%, #0b0f1e 38%, #131833 54%, rgba(26, 24, 58, 0.42) 72%, rgba(253, 251, 247, 0) 94%)
          `,
          WebkitMaskImage: `
            linear-gradient(90deg, rgba(0,0,0,0.65) 0%, black 10%, black 90%, rgba(0,0,0,0.65) 100%),
            linear-gradient(to bottom, black 0%, black 58%, transparent 96%)
          `,
          WebkitMaskComposite: 'source-in',
          maskImage: `
            linear-gradient(90deg, rgba(0,0,0,0.65) 0%, black 10%, black 90%, rgba(0,0,0,0.65) 100%),
            linear-gradient(to bottom, black 0%, black 58%, transparent 96%)
          `,
          maskComposite: 'intersect',
        }}
      >




        {/* Destello blanco intermitente al impactar el rayo */}
        {vibrando && (
          <div
            className="flash-cupula-mobile absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 22%, rgba(255, 255, 255, 0.95) 0%, rgba(224, 231, 255, 0.65) 50%, transparent 90%)',
            }}
          />
        )}

        {/* Estrellas concentradas en la franja nocturna central */}
        <svg
          className="w-full h-full opacity-95"
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, black 52%, transparent 96%)',
            maskImage: 'linear-gradient(to bottom, black 52%, transparent 96%)',
          }}
          xmlns="http://w3.org"
        >
          <circle cx="24%" cy="10%" r="1.6" fill="#ffffff" opacity="0.95" />
          <circle cx="34%" cy="7%" r="1.1" fill="#c7d2fe" opacity="0.75" />
          <circle cx="52%" cy="9%" r="1.4" fill="#ffffff" opacity="0.8" />
          <circle cx="68%" cy="8%" r="1.8" fill="#ffffff" opacity="0.9" />
          <circle cx="78%" cy="14%" r="1.3" fill="#e0e7ff" opacity="0.85" />
          <circle cx="22%" cy="24%" r="1.5" fill="#a5b4fc" opacity="0.7" />
          <circle cx="32%" cy="20%" r="1" fill="#ffffff" opacity="0.65" />
          <circle cx="72%" cy="22%" r="1.4" fill="#ffffff" opacity="0.75" />
          <circle cx="80%" cy="28%" r="1.7" fill="#ddd6fe" opacity="0.85" />
          <circle cx="26%" cy="38%" r="1.3" fill="#ffffff" opacity="0.65" />
          <circle cx="42%" cy="36%" r="1.1" fill="#c7d2fe" opacity="0.55" />
          <circle cx="62%" cy="40%" r="1.5" fill="#ffffff" opacity="0.7" />
          <circle cx="75%" cy="44%" r="1.2" fill="#a5b4fc" opacity="0.6" />
          <circle cx="32%" cy="52%" r="1.2" fill="#ffffff" opacity="0.45" />
          <circle cx="68%" cy="54%" r="1.1" fill="#e0e7ff" opacity="0.4" />
        </svg>
      </div>

      {/* LOGOTIPO GRANDE CLAVADO ARRIBA EN LA CÚPULA */}
      <div
        onClick={() => {
          if (!rayoActivo && !vibrando) iniciarSecuenciaMobile();
        }}
        className="lg:hidden absolute top-2 sm:top-6 left-1/2 -translate-x-1/2 z-20 flex justify-center cursor-pointer"
      >
        <div
          className="relative h-36 sm:h-40"
          style={{ aspectRatio: '417 / 274' }}
        >
          {/* Rayo central cayendo desde lo alto de la cúpula */}
          {rayoActivo && (
            <svg
              className="rayo-mobile absolute -top-[24%] left-1/2 h-[195%] w-[180%] pointer-events-none z-20"
              viewBox="0 0 140 100"
              fill="#00f0ff"
              style={{
                filter:
                  'drop-shadow(0 0 8px #00f0ff) drop-shadow(0 0 20px #0066ff) drop-shadow(0 0 38px #002299)',
              }}
            >
              <path
                d="M50,0 L40,18 L53,18 L36,36 L48,36 L32,56 L45,56 L26,76 L41,76 L15,100 L32,79 L20,79 L38,59 L26,59 L43,39 L31,39 L48,21 L36,21 Z"
                transform="translate(36, 0)"
              />
            </svg>
          )}

          {/* Capas de eco y logo principal fundido con el cielo nocturno */}
          {ecos.map((eco, index) => {
            const esLogoFrente = index === ecos.length - 1;

            return (
              <img
                key={index}
                src={src}
                alt={esLogoFrente ? 'Logotipo de la empresa' : ''}
                className={`h-full w-full object-contain absolute inset-0 will-change-transform ${
                  vibrando && !esLogoFrente ? 'vibracion-mobile' : ''
                } ${
                  esLogoFrente
                    ? 'drop-shadow-[0_6px_22px_rgba(99,102,241,0.45)]'
                    : ''
                }`}
                style={
                  {
                    opacity: esLogoFrente ? 1.0 : eco.opacity,
                    filter: eco.filter,
                    mixBlendMode: 'screen',
                    '--max-x': `${eco.x}px`,
                    animationDelay: eco.delay,
                    transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
                  } as React.CSSProperties
                }
              />
            );
          })}
        </div>
      </div>
    </>
  );
};

export default MobileStormIntro;
