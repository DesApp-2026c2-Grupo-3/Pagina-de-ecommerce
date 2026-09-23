// src/components/LogoConEco.tsx
import React, { useState, useEffect } from 'react';
import logo from '../assets/logoX.png';

// 1. Definimos las propiedades que va a recibir el componente
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
    // El estado de vibración ahora inicia apagado (false)
    const [vibrando, setVibrando] = useState(false);

    useEffect(() => {
        // 2. ESCUCHA LA VARIABLE: Si pasa a ser true, dispara la vibración
        if (isAuthenticated) {
            setVibrando(true);

            // Tras 1.2 segundos (1200ms), cese de la vibración
            const timer = setTimeout(() => {
                setVibrando(false);
            }, 1200);

            return () => clearTimeout(timer);
        }
    }, [isAuthenticated]); // El useEffect vigila activamente si 'isAuthenticated' cambia

    // Configuración de tus ecos (si vibrando es false, regresan a 0 y se ocultan)
    const ecos: EcoConfig[] = [
        { x: vibrando ? 20 : 0,  opacity: vibrando ? 0.15 : 0, filter: 'hue-rotate(180deg) brightness(1.6) blur(1px)', delay: '0s' },   
        { x: vibrando ? -20 : 0, opacity: vibrando ? 0.30 : 0, filter: 'hue-rotate(240deg) brightness(1.4)',           delay: '0.1s' }, 
        { x: vibrando ? 10 : 0,  opacity: vibrando ? 0.50 : 0, filter: 'hue-rotate(300deg) brightness(1.3)',           delay: '0.05s' },
        { x: vibrando ? -10 : 0, opacity: vibrando ? 0.65 : 0, filter: 'hue-rotate(0deg) saturate(1.5)',               delay: '0.15s' },
        { x: 0,                  opacity: 1.00,                filter: 'none',                                         delay: '0s' }    
    ];

    return (
        <div className="flex-1 flex justify-center py-4">
            <div className="relative h-24 w-96">
                {/* KEYFRAMES DE VIBRACIÓN NATIVOS */}
                <style>{`
                    @keyframes vibrarGlitch {
                        0%   { transform: translate(0px, 0px); }
                        20%  { transform: translate(calc(var(--max-x) * 0.8), calc(var(--max-x) * -0.2)); }
                        40%  { transform: translate(calc(var(--max-x) * -0.5), calc(var(--max-x) * 0.3)); }
                        60%  { transform: translate(calc(var(--max-x) * 0.9), calc(var(--max-x) * 0.1)); }
                        80%  { transform: translate(calc(var(--max-x) * -0.3), calc(var(--max-x) * -0.4)); }
                        100% { transform: translate(0px, 0px); }
                    }
                    .vibracion-activa {
                        animation: vibrarGlitch 0.2s infinite linear;
                    }
                `}</style>

                {ecos.map((eco, index) => {
                    const esLogoFrente = index === ecos.length - 1;

                    return (
                        <img
                            key={index}
                            src={logo}
                            alt="Logotipo con efecto de vibración cromática"
                            className={`h-24 w-auto object-cover absolute top-0 will-change-transform ${
                                vibrando && !esLogoFrente ? 'vibracion-activa' : ''
                            }`}
                            style={
                                {
                                    left: '0px', 
                                    opacity: eco.opacity,
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
