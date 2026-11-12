import React, { useState, useEffect, useCallback } from 'react';

interface LogoProps {
    isAuthenticated: boolean;
    src?: string;
    repetirCadaMs?: number;
    className?: string;
}

interface EcoConfig {
    x: number;
    opacity: number;
    filter: string;
    delay: string;
}

export const LogoConEco: React.FC<LogoProps> = ({
    isAuthenticated,
    src = '/logo-empresa.png',
    repetirCadaMs = 18000,
    className = 'h-36 sm:h-48',
}) => {
    const [rayosLateralesActivos, setRayosLateralesActivos] = useState(false);
    const [iluminandoCielo, setIluminandoCielo] = useState(false);
    const [rayoCentralActivo, setRayoCentralActivo] = useState(false);
    const [vibrando, setVibrando] = useState(false);
    const [logoPrecargado, setLogoPrecargado] = useState(false);

    const efectoActivo = !isAuthenticated;

    useEffect(() => {
        const img = new Image();
        img.src = src;
        img.onload = () => setLogoPrecargado(true);
    }, [src]);

    const ejecutarSecuenciaLogo = useCallback(() => {
        setRayosLateralesActivos(false);
        setIluminandoCielo(false);
        setRayoCentralActivo(false);
        setVibrando(false);

        // ACTO 1 (0ms a 1100ms): Rayo sup-izq cae + Rayo inf-der asciende
        setRayosLateralesActivos(true);

        // ACTO 2 (1100ms a 2250ms): Terminan los rayos y se ilumina el hemisferio izquierdo
        const tCielo = setTimeout(() => {
            setRayosLateralesActivos(false);
            setIluminandoCielo(true);
        }, 1100);

        // ACTO 3 (2250ms): Se apaga el cielo y cae el rayo central sobre el logo
        const tRayoCentral = setTimeout(() => {
            setIluminandoCielo(false);
            setRayoCentralActivo(true);
        }, 2250);

        // IMPACTO CENTRAL (2750ms): El logo vibra con sus ecos
        const tVibracionStart = setTimeout(() => {
            setVibrando(true);
        }, 2750);

        // FIN DE LA SECUENCIA COMPLETA (3800ms)
        const tFin = setTimeout(() => {
            setVibrando(false);
            setRayoCentralActivo(false);
        }, 3800);

        return () => {
            clearTimeout(tCielo);
            clearTimeout(tRayoCentral);
            clearTimeout(tVibracionStart);
            clearTimeout(tFin);
        };
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            setRayosLateralesActivos(false);
            setIluminandoCielo(false);
            setRayoCentralActivo(false);
            setVibrando(false);
            return;
        }

        if (!logoPrecargado) return;

        const limpiarTimers = ejecutarSecuenciaLogo();

        const intervalId = setInterval(() => {
            ejecutarSecuenciaLogo();
        }, repetirCadaMs);

        return () => {
            limpiarTimers();
            clearInterval(intervalId);
        };
    }, [isAuthenticated, logoPrecargado, repetirCadaMs, ejecutarSecuenciaLogo]);

    const ecos: EcoConfig[] = [
        { x: vibrando ? 40 : 0, opacity: vibrando ? 0.15 : 0, filter: 'hue-rotate(180deg) brightness(1.6) blur(1px)', delay: '0s' },
        { x: vibrando ? -20 : 0, opacity: vibrando ? 0.30 : 0, filter: 'hue-rotate(240deg) brightness(1.4)', delay: '0.1s' },
        { x: vibrando ? 10 : 0, opacity: vibrando ? 0.50 : 0, filter: 'hue-rotate(300deg) brightness(1.3)', delay: '0.05s' },
        { x: vibrando ? -10 : 0, opacity: vibrando ? 0.65 : 0, filter: 'hue-rotate(0deg) saturate(1.5)', delay: '0.15s' },
        { x: 0, opacity: 1.0, filter: 'none', delay: '0s' },
    ];

    const ocupandoSecuencia = rayosLateralesActivos || iluminandoCielo || rayoCentralActivo || vibrando;

    return (
        <div
            data-iluminando={iluminandoCielo}
            onClick={() => {
                if (efectoActivo && !ocupandoSecuencia) ejecutarSecuenciaLogo();
            }}
            title={efectoActivo ? 'Clic para repetir secuencia' : undefined}
            className={`flex shrink-0 items-center justify-center ${efectoActivo ? 'cursor-pointer' : ''}`}
        >
            <div
                className={`relative ${className}`}
                style={{
                    aspectRatio: '417 / 274',
                }}
            >
                <style>{`
          @keyframes vibrarGlitch {
            0%   { transform: translate(0px, 0px); }
            20%  { transform: translate(calc(var(--max-x) * 0.8), calc(var(--max-x) * -0.2)); }
            40%  { transform: translate(calc(var(--max-x) * -0.5), calc(var(--max-x) * 0.3)); }
            60%  { transform: translate(calc(var(--max-x) * 0.9), calc(var(--max-x) * 0.1)); }
            80%  { transform: translate(calc(var(--max-x) * -0.3), calc(var(--max-x) * -0.4)); }
            100% { transform: translate(0px, 0px); }
          }
          
          @keyframes animarRayoCentrado {
            0% { transform: translate(-50%, -50%) scaleY(0.1) scaleX(0.4); opacity: 0; }
            15% { opacity: 1; transform: translate(-50%, -50%) scaleY(1.1) scaleX(1.1); }
            30% { transform: translate(-50%, -50%) scaleY(1) scaleX(1); }
            100% { transform: translate(-50%, -50%) scaleY(1.3) scaleX(1.4); opacity: 0; }
          }

          @keyframes rayoElectricoTop {
            0%   { transform: scaleY(0.1) scaleX(0.5); opacity: 0; transform-origin: top center; }
            12%  { opacity: 1; transform: scaleY(1.12) scaleX(1.15) translateX(-2px); transform-origin: top center; }
            24%  { opacity: 0.65; transform: scaleY(0.98) scaleX(0.95) translateX(3px); transform-origin: top center; }
            36%  { opacity: 1; transform: scaleY(1.08) scaleX(1.1) translateX(-2px); transform-origin: top center; }
            55%  { opacity: 0.9; transform: scaleY(1) scaleX(1) translateX(0px); transform-origin: top center; }
            100% { opacity: 0; transform: scaleY(1.25) scaleX(1.3); transform-origin: top center; }
          }

          @keyframes rayoElectricoBottom {
            0%   { transform: scaleY(0.1) scaleX(0.5); opacity: 0; transform-origin: bottom center; }
            12%  { opacity: 1; transform: scaleY(1.12) scaleX(1.15) translateX(2px); transform-origin: bottom center; }
            24%  { opacity: 0.65; transform: scaleY(0.98) scaleX(0.95) translateX(-3px); transform-origin: bottom center; }
            36%  { opacity: 1; transform: scaleY(1.08) scaleX(1.1) translateX(2px); transform-origin: bottom center; }
            55%  { opacity: 0.9; transform: scaleY(1) scaleX(1) translateX(0px); transform-origin: bottom center; }
            100% { opacity: 0; transform: scaleY(1.25) scaleX(1.3); transform-origin: bottom center; }
          }

                    @keyframes relampagoPadre {
            0%   { opacity: 0; }
            8%   { opacity: 0.96; }   /* Fogonazo blanco cegador casi puro */
            22%  { opacity: 0.25; }   /* Breve respiro eléctrico */
            40%  { opacity: 0.85; }   /* Segundo relámpago muy intenso */
            60%  { opacity: 0.15; }   /* Caída rápida */
            76%  { opacity: 0.48; }   /* Tercer destello residual marcado */
            100% { opacity: 0; }      /* Se apaga por completo */
          }

          div:has(> div > [data-iluminando="true"])::after {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 20;
            filter: brightness(1.3);
            background: radial-gradient(
              circle at 45% 45%,
              rgba(255, 255, 255, 1) 0%,
              rgba(255, 255, 255, 0.92) 45%,
              rgba(224, 231, 255, 0.78) 75%,
              rgba(199, 210, 254, 0.65) 100%
            );
            animation: relampagoPadre 1.1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }


          .vibracion-activa {
            animation: vibrarGlitch 0.2s infinite linear;
          }

          .rayo-centrado-perfecto {
            animation: animarRayoCentrado 0.95s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
            transform-origin: center center;
          }

          .anim-rayo-sup-izq {
            animation: rayoElectricoTop 1.05s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
          }

          .anim-rayo-inf-der {
            animation: rayoElectricoBottom 1.05s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
          }
        `}</style>
                        {rayosLateralesActivos && (
          <>
            {/* Rayo Superior Izquierdo: 3 eslabones ocultos en el techo */}
            <svg
              className="anim-rayo-sup-izq hidden lg:block fixed -top-[14vh] left-[3.5%] h-[40vh] w-[18vw] pointer-events-none z-50"
              viewBox="0 0 140 100"
              fill="#e0faff"
              style={{
                filter:
                  'drop-shadow(0 0 6px #ffffff) drop-shadow(0 0 14px #00f0ff) drop-shadow(0 0 30px #0066ff)',
                mixBlendMode: 'screen',
              }}
            >
              <path
                d="M50,0 L40,18 L53,18 L36,36 L48,36 L32,56 L45,56 L26,76 L41,76 L15,100 L32,79 L20,79 L38,59 L26,59 L43,39 L31,39 L48,21 L36,21 Z"
                transform="translate(36, 0)"
              />
            </svg>

                       {/* Rayo Superior Derecho (Espejado en el eje X desde el techo derecho) */}
            <svg
              className="anim-rayo-sup-izq fixed -top-[14vh] left-[28.5%] h-[40vh] w-[18vw] pointer-events-none z-50"
              viewBox="0 0 140 100"
              fill="#e0faff"
              style={{
                filter:
                  'drop-shadow(0 0 6px #ffffff) drop-shadow(0 0 14px #00f0ff) drop-shadow(0 0 30px #0066ff)',
                mixBlendMode: 'screen',
              }}
            >
              <path
                d="M50,0 L40,18 L53,18 L36,36 L48,36 L32,56 L45,56 L26,76 L41,76 L15,100 L32,79 L20,79 L38,59 L26,59 L43,39 L31,39 L48,21 L36,21 Z"
                transform="translate(104, 0) scale(-1, 1)"
              />
            </svg>

          </>
        )}


                {/* ACTO 3: RAYO CENTRAL SOBRE EL LOGO */}
                {rayoCentralActivo && (
                    <svg
                        className="rayo-centrado-perfecto absolute -top-[22%] left-1/2 h-[190%] w-[180%] pointer-events-none z-20"
                        viewBox="0 0 140 100"
                        fill="#00f0ff"
                        style={{
                            filter:
                                'drop-shadow(0 0 8px #00f0ff) drop-shadow(0 0 20px #0066ff) drop-shadow(0 0 40px #002299)',
                            mixBlendMode: 'screen',
                        }}
                    >
                        <path
                            d="M50,0 L40,18 L53,18 L36,36 L48,36 L32,56 L45,56 L26,76 L41,76 L15,100 L32,79 L20,79 L38,59 L26,59 L43,39 L31,39 L48,21 L36,21 Z"
                            transform="translate(36, 0)"
                        />
                    </svg>
                )}

                {/* EL LOGO Y SUS ECOS VIBRANTES */}
                {ecos.map((eco, index) => {
                    const esLogoFrente = index === ecos.length - 1;

                    if (!efectoActivo && !esLogoFrente) return null;

                    return (
                        <img
                            key={index}
                            src={src}
                            alt={esLogoFrente ? 'Logotipo de la empresa' : ''}
                            className={`h-full w-full object-contain absolute inset-0 will-change-transform ${vibrando && !esLogoFrente ? 'vibracion-activa' : ''
                                } ${esLogoFrente ? 'drop-shadow-[0_4px_20px_rgba(99,102,241,0.35)]' : ''
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
    );
};

export default LogoConEco;

