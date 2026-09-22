// src/components/LogoConEco.tsx
import React from 'react';
import logo from '../assets/logoX.png';

// Definimos el tipo de datos para cada eco
interface EcoConfig {
    x: number;
    opacity: number;
    filter: string;
}

export const LogoConEco: React.FC = () => {
    // Configuración de los ecos hacia la derecha tipada correctamente
    const ecos: EcoConfig[] = [
        { x: 45, opacity: 0.2, filter: 'hue-rotate(180deg) brightness(1.5)' }, // Cian
        { x: 30, opacity: 0.4, filter: 'hue-rotate(300deg) brightness(1.3)' }, // Magenta
        { x: 15, opacity: 0.6, filter: 'hue-rotate(60deg) brightness(1.2)' },  // Amarillo/Verde
        { x: 0, opacity: 1.0, filter: 'none' },                               // Original al frente
    ];

    return (
        <div className="flex-1 flex justify-center">
            {/* Ampliamos el contenedor a w-96 (más espacio a la derecha) para que la cola larga no se corte */}
            <div className="relative h-24 w-96">
                {[
                    { x: 20, opacity: 0.10, filter: 'hue-rotate(180deg) brightness(1.6) blur(2px)' }, // Más lejano aún
                    { x: -20, opacity: 0.25, filter: 'hue-rotate(240deg) brightness(1.4)' },
                    { x: 10, opacity: 0.45, filter: 'hue-rotate(300deg) brightness(1.3)' },
                    { x: -10, opacity: 0.60, filter: 'hue-rotate(0deg) saturate(1.5)' },
                    { x: 0, opacity: 1.00, filter: 'none' }
                ].map((eco, index) => (
                    <img
                        key={index}
                        src={logo} // Tu variable de logo actual
                        alt="Logotipo con efecto de eco estirado"
                        className="h-24 w-auto object-cover absolute top-0 will-change-transform"
                        style={{
                            left: `${eco.x}px`,
                            opacity: eco.opacity,
                            filter: eco.filter,
                            mixBlendMode: 'screen', // Fusión cromática perfecta en fondos oscuros
                            transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
                        }}
                    />
                ))}
            </div>
        </div>

    );
};
