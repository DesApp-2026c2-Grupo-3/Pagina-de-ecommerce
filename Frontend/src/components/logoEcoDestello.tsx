// src/components/LogoConEco.tsx
import React, { useState, useEffect } from 'react';
import logo from '../assets/logoX.png';

interface LogoProps {
    isAuthenticated: boolean;
}

interface EcoConfig {
    x: number;
    opacity: number;
    filter: string;
    delay: string;
}

export const LogoConEco: React.FC<LogoProps> = ({ isAuthenticated }) => {
    const [vibrando, setVibrando] = useState(false);
    const [rayoActivo, setRayoActivo] = useState(false);
    const [mostrarLogo, setMostrarLogo] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            setRayoActivo(true);
            setMostrarLogo(false);
            setVibrando(false);

            // Impacto a los 400ms: aparece el logo en el centro exacto
            const timerVibracionStart = setTimeout(() => {
                setMostrarLogo(true);
                setVibrando(true);
            }, 600);

            // Fin de la secuencia a los 1600ms totales
            const timerVibracionEnd = setTimeout(() => {
                setVibrando(false);
                setRayoActivo(false); 
            }, 1600);

            return () => {
                clearTimeout(timerVibracionStart);
                clearTimeout(timerVibracionEnd);
            };
        }
    }, [isAuthenticated]);

    const ecos: EcoConfig[] = [
        { x: vibrando ? 20 : 0,  opacity: vibrando ? 0.15 : 0, filter: 'hue-rotate(180deg) brightness(1.6) blur(1px)', delay: '0s' },   
        { x: vibrando ? -20 : 0, opacity: vibrando ? 0.30 : 0, filter: 'hue-rotate(240deg) brightness(1.4)',           delay: '0.1s' }, 
        { x: vibrando ? 10 : 0,  opacity: vibrando ? 0.50 : 0, filter: 'hue-rotate(300deg) brightness(1.3)',           delay: '0.05s' },
        { x: vibrando ? -10 : 0, opacity: vibrando ? 0.65 : 0, filter: 'hue-rotate(0deg) saturate(1.5)',               delay: '0.15s' },
        { x: 0,                  opacity: mostrarLogo ? 1.00 : 0, filter: 'none',                                      delay: '0s' }    
    ];

    return (
        <div className="flex shrink-0 items-center justify-center">
            <div
                className="relative"
                style={{
                    height: 'clamp(2.25rem, 4vw + 1.2rem, 3.5rem)',
                    aspectRatio: '417 / 274',
                }}
            >
                {/* ANIMACIONES NATIVAS CORREGIDAS */}
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

                    .vibracion-activa {
                        animation: vibrarGlitch 0.2s infinite linear;
                    }

                    .rayo-centrado-perfecto {
                        animation: animarRayoCentrado 0.65s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
                        transform-origin: center center; /* Fuerza el anclaje en la mitad */
                    }
                `}</style>

                {/* LOS RAYOS: Idénticos, uno en el centro y otro desplazado a la derecha */}
                {rayoActivo && (
                    <svg 
                        className="rayo-centrado-perfecto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[240%] w-[180%] pointer-events-none z-0"
                        viewBox="0 0 140 100" // Ampliado a 140 para dar margen al espacio derecho
                        fill="#00f0ff"
                        style={{
                            filter: 'drop-shadow(0 0 8px #00f0ff) drop-shadow(0 0 20px #0066ff) drop-shadow(0 0 40px #002299)',
                            mixBlendMode: 'screen'
                        }}
                    >
                        {/* RAYO ORIGINAL (Centro) */}
                        {/*<path d="M50,0 L40,18 L53,18 L36,36 L48,36 L32,56 L45,56 L26,76 L41,76 L15,100 L32,79 L20,79 L38,59 L26,59 L43,39 L31,39 L48,21 L36,21 Z" />
                        
                        {/* RAYO REPLICADO (Derecha): Idéntica forma y orientación gracias al translate */}
                        <path 
                            d="M50,0 L40,18 L53,18 L36,36 L48,36 L32,56 L45,56 L26,76 L41,76 L15,100 L32,79 L20,79 L38,59 L26,59 L43,39 L31,39 L48,21 L36,21 Z" 
                            transform="translate(100, 0)" 
                        />
                    </svg>
                )}

                {/* EL LOGO Y ECOS */}
                {mostrarLogo && ecos.map((eco, index) => {
                    const esLogoFrente = index === ecos.length - 1;

                    return (
                        <img
                            key={index}
                            src={logo}
                            alt="Logotipo con efecto de vibración cromática"
                            className={`h-full w-full object-contain absolute inset-0 will-change-transform z-10 ${
                                vibrando ? 'vibracion-activa' : ''
                            }`}
                            style={
                                {
                                    opacity: esLogoFrente ? 1.00 : eco.opacity,
                                    filter: eco.filter,
                                    mixBlendMode: 'screen', 
                                    '--max-x': `${eco.x}px`,
                                    animationDelay: eco.delay,
                                    transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
                                } as React.CSSProperties
                            }
                        />
                    );
                })}
            </div>
        </div>
    );
};
