import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import type { AdministradorSesion } from '../types/sesion.types'
import { iniciarSesion as iniciarSesionApi } from '../services/authService'
import { useAuth } from '../context/AuthContext'


interface EstructuraUrbana {
    x: number // % dentro del mapa
    y: number
    w: number // ancho px
    d: number // profundidad px
    h: number // altura base px
    tipo: 'casa' | 'edificio' | 'torre'
}


// 8 Manzanas perfectamente alineadas con veredas (dejan avenidas de 64px y calles internas de 36px)
const MANZANAS = [
    // Sector Noroeste (2 manzanas)
    { x: 60, y: 60, w: 348, d: 156 },   // Manzana NO-Norte (Residencial casas)
    { x: 60, y: 252, w: 348, d: 156 },  // Manzana NO-Sur (Mixto)
    // Sector Noreste (2 manzanas)
    { x: 492, y: 60, w: 348, d: 156 },  // Manzana NE-Norte (Residencial + edificios)
    { x: 492, y: 252, w: 348, d: 156 }, // Manzana NE-Sur (Distrito corporativo)
    // Sector Suroeste (2 manzanas)
    { x: 60, y: 492, w: 348, d: 156 },  // Manzana SO-Norte (Barrio de casas)
    { x: 60, y: 684, w: 348, d: 156 },  // Manzana SO-Sur (Residencial + torre)
    // Sector Sureste (2 manzanas)
    { x: 492, y: 492, w: 348, d: 156 }, // Manzana SE-Norte (Zona comercial)
    { x: 492, y: 684, w: 348, d: 156 }, // Manzana SE-Sur (Residencial casas)
]

const CIUDAD: EstructuraUrbana[] = [
    // ================= MANZANA NO-NORTE (x: 60..408, y: 60..216) =================
    { x: 74, y: 74, w: 44, d: 36, h: 20, tipo: 'casa' },
    { x: 130, y: 74, w: 44, d: 36, h: 22, tipo: 'casa' },
    { x: 186, y: 74, w: 44, d: 36, h: 20, tipo: 'casa' },
    { x: 242, y: 74, w: 44, d: 36, h: 22, tipo: 'casa' },
    { x: 302, y: 74, w: 90, d: 56, h: 58, tipo: 'edificio' },
    { x: 74, y: 126, w: 44, d: 36, h: 22, tipo: 'casa' },
    { x: 130, y: 126, w: 44, d: 36, h: 20, tipo: 'casa' },
    { x: 186, y: 126, w: 44, d: 36, h: 22, tipo: 'casa' },
    { x: 242, y: 142, w: 150, d: 60, h: 48, tipo: 'edificio' },

    // ================= MANZANA NO-SUR (x: 60..408, y: 252..408) =================
    { x: 74, y: 266, w: 44, d: 36, h: 20, tipo: 'casa' },
    { x: 130, y: 266, w: 44, d: 36, h: 22, tipo: 'casa' },
    { x: 74, y: 318, w: 44, d: 36, h: 22, tipo: 'casa' },
    { x: 130, y: 318, w: 44, d: 36, h: 20, tipo: 'casa' },
    { x: 192, y: 266, w: 72, d: 64, h: 68, tipo: 'edificio' },
    { x: 280, y: 266, w: 112, d: 126, h: 105, tipo: 'torre' },
    { x: 192, y: 342, w: 72, d: 50, h: 46, tipo: 'edificio' },

    // ================= MANZANA NE-NORTE (x: 492..840, y: 60..216) =================
    { x: 506, y: 74, w: 84, d: 62, h: 64, tipo: 'edificio' },
    { x: 604, y: 74, w: 44, d: 36, h: 22, tipo: 'casa' },
    { x: 660, y: 74, w: 44, d: 36, h: 20, tipo: 'casa' },
    { x: 716, y: 74, w: 44, d: 36, h: 22, tipo: 'casa' },
    { x: 772, y: 74, w: 52, d: 58, h: 52, tipo: 'edificio' },
    { x: 506, y: 148, w: 120, d: 54, h: 88, tipo: 'torre' },
    { x: 640, y: 148, w: 44, d: 36, h: 20, tipo: 'casa' },
    { x: 696, y: 148, w: 44, d: 36, h: 22, tipo: 'casa' },
    { x: 752, y: 148, w: 72, d: 54, h: 56, tipo: 'edificio' },

    // ================= MANZANA NE-SUR (x: 492..840, y: 252..408) =================
    { x: 508, y: 268, w: 118, d: 124, h: 125, tipo: 'torre' },
    { x: 642, y: 268, w: 86, d: 60, h: 76, tipo: 'edificio' },
    { x: 742, y: 268, w: 82, d: 60, h: 62, tipo: 'edificio' },
    { x: 642, y: 340, w: 96, d: 52, h: 95, tipo: 'torre' },
    { x: 752, y: 348, w: 44, d: 36, h: 22, tipo: 'casa' },

    // ================= MANZANA SO-NORTE (x: 60..408, y: 492..648) =================
    { x: 74, y: 506, w: 44, d: 36, h: 20, tipo: 'casa' },
    { x: 130, y: 506, w: 44, d: 36, h: 22, tipo: 'casa' },
    { x: 186, y: 506, w: 44, d: 36, h: 20, tipo: 'casa' },
    { x: 242, y: 506, w: 68, d: 58, h: 54, tipo: 'edificio' },
    { x: 324, y: 506, w: 68, d: 126, h: 86, tipo: 'torre' },
    { x: 74, y: 558, w: 44, d: 36, h: 22, tipo: 'casa' },
    { x: 130, y: 558, w: 44, d: 36, h: 20, tipo: 'casa' },
    { x: 186, y: 558, w: 44, d: 36, h: 22, tipo: 'casa' },
    { x: 242, y: 576, w: 68, d: 56, h: 48, tipo: 'edificio' },

    // ================= MANZANA SO-SUR (x: 60..408, y: 684..840) =================
    { x: 74, y: 698, w: 44, d: 36, h: 22, tipo: 'casa' },
    { x: 130, y: 698, w: 44, d: 36, h: 20, tipo: 'casa' },
    { x: 186, y: 698, w: 44, d: 36, h: 22, tipo: 'casa' },
    { x: 242, y: 698, w: 44, d: 36, h: 20, tipo: 'casa' },
    { x: 300, y: 698, w: 92, d: 126, h: 96, tipo: 'torre' },
    { x: 74, y: 750, w: 44, d: 36, h: 20, tipo: 'casa' },
    { x: 130, y: 750, w: 44, d: 36, h: 22, tipo: 'casa' },
    { x: 186, y: 750, w: 98, d: 74, h: 62, tipo: 'edificio' },

    // ================= MANZANA SE-NORTE (x: 492..840, y: 492..648) =================
    { x: 508, y: 508, w: 112, d: 124, h: 114, tipo: 'torre' },
    { x: 634, y: 508, w: 86, d: 58, h: 66, tipo: 'edificio' },
    { x: 734, y: 508, w: 90, d: 58, h: 52, tipo: 'edificio' },
    { x: 634, y: 580, w: 44, d: 36, h: 22, tipo: 'casa' },
    { x: 690, y: 580, w: 44, d: 36, h: 20, tipo: 'casa' },
    { x: 746, y: 580, w: 78, d: 52, h: 78, tipo: 'edificio' },

    // ================= MANZANA SE-SUR (x: 492..840, y: 684..840) =================
    { x: 508, y: 698, w: 94, d: 62, h: 68, tipo: 'edificio' },
    { x: 616, y: 698, w: 44, d: 36, h: 20, tipo: 'casa' },
    { x: 672, y: 698, w: 44, d: 36, h: 22, tipo: 'casa' },
    { x: 728, y: 698, w: 96, d: 126, h: 108, tipo: 'torre' },
    { x: 508, y: 772, w: 44, d: 36, h: 22, tipo: 'casa' },
    { x: 564, y: 772, w: 44, d: 36, h: 20, tipo: 'casa' },
    { x: 620, y: 772, w: 94, d: 52, h: 54, tipo: 'edificio' },
]

const TEXTURA_ESFERA_SVG = `url("/logo.png")`


export default function Home2() {
    const navigate = useNavigate()
    const { iniciarSesion } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [mostrarPassword, setMostrarPassword] = useState(false)
    const [transparente, setTransparente] = useState(true)

    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(false)
    const [ensamblado, setEnsamblado] = useState(false)

    const [conectadoServidor, setConectadoServidor] = useState(false)

    // Estados visuales para el escenario 3D
    const [tilt, setTilt] = useState({ x: 0, y: 0 })
    const [animandoEntrada, setAnimandoEntrada] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setConectadoServidor(true), 400)
        return () => clearTimeout(timer)
    }, [])

    const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
        if (animandoEntrada) return
        const { innerWidth, innerHeight } = window
        const normX = (e.clientX / innerWidth - 0.5) * 14
        const normY = (e.clientY / innerHeight - 0.5) * 10
        setTilt({ x: normX, y: normY })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setCargando(true)
        setError('')

        try {
            const administrador = await iniciarSesionApi(email, password)

            const sesion: AdministradorSesion = {
                id: administrador.id,
                nombre: administrador.nombre,
                email: administrador.email,
                rol: administrador.rol,
                sucursalId: administrador.sucursalId ?? null,
                sucursal: administrador.sucursal ?? null,
            }

            // Iniciamos la animación de zoom hacia la sucursal antes de navegar
            setAnimandoEntrada(true)

            setTimeout(() => {
                iniciarSesion(sesion, administrador.token)

                navigate('/admin')
            }, 1200)
        } catch {
            setError('Email o contraseña incorrectos')
            setCargando(false)
        }
    }

    const hayError = Boolean(error)

    return (
        <main
            onMouseMove={handleMouseMove}
            className="relative h-screen w-full overflow-hidden flex items-center justify-center lg:justify-end lg:pr-[4%] select-none bg-[#020705] font-sans"
        >


            {/* =========================================================
                    ESTILOS Y KEYFRAMES 3D
                ========================================================= */}
            <style>{`
                                                            
                                                            
                                                @keyframes orbitRingSlow {
                        0%   { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    @keyframes counterSpinItem {
                        0%   { transform: rotate(0deg); }
                        100% { transform: rotate(-360deg); }
                    }
                    @keyframes fusionFlash {
                        0%   { opacity: 0; transform: scale(0.4); }
                        35%  { opacity: 1; transform: scale(1.35); }
                        100% { opacity: 0; transform: scale(1.8); }
                    }
                    @keyframes logoPulseActive {
                        0%, 100% { opacity: 0.25; transform: scale(1.02); }
                        50%      { opacity: 1; transform: scale(1.045); }
                    }
                                    @keyframes modalPerimeterAlways {
                        0%   { stroke-dashoffset: 100; }
                        100% { stroke-dashoffset: 0; }
                    }
                    .bolt-perimeter-active {
                        stroke-dasharray: 26 74;
                        animation: modalPerimeterAlways 3.5s linear infinite;
                    }



                    .ingredients-ring {
                        animation: orbitRingSlow 18s linear infinite;
                    }
                    .ingredient-upright {
                        animation: counterSpinItem 18s linear infinite;
                    }
                    .burger-fusion-flash {
                        animation: fusionFlash 0.9s ease-out forwards;
                    }
                    .logo-active-glow {
                        animation: logoPulseActive 3s ease-in-out infinite;
                    }
                    



                    .bolt-logo-aura {
                        animation: logoEnergyAura 6.5s ease-out infinite;
                    }
                



                    @keyframes spinGrid3D {
                        0%   { transform: rotateZ(0deg) translate3d(0, 0, 0); }
                        100% { transform: rotateZ(360deg) translate3d(0, 0, 0); }
                    }
                                @keyframes spinBurgerSphere {
                        0%   { transform: translateZ(34px) rotateZ(0deg); }
                        100% { transform: translateZ(34px) rotateZ(360deg); }
                    }
                    .burger-sphere-3d {
                        transform-style: preserve-3d;
                        will-change: transform;
                        animation: spinBurgerSphere 12s linear infinite;
                    }


                    @keyframes riderRoute1 {
                        0%   { transform: translate(0px, 0px) translateZ(3px); opacity: 0; }
                        15%  { opacity: 1; }
                        50%  { transform: translate(180px, 0px) translateZ(3px); }
                        85%  { opacity: 1; }
                        100% { transform: translate(180px, -180px) translateZ(3px); opacity: 0; }
                    }
                    @keyframes riderRoute2 {
                        0%   { transform: translate(0px, 0px) translateZ(3px); opacity: 0; }
                        15%  { opacity: 1; }
                        50%  { transform: translate(-135px, 0px) translateZ(3px); }
                        85%  { opacity: 1; }
                        100% { transform: translate(-135px, 180px) translateZ(3px); opacity: 0; }
                    }
                    @keyframes pulseRadar {
                        0%   { transform: translateZ(1px) scale(0.8); opacity: 0.8; }
                        100% { transform: translateZ(1px) scale(2.8); opacity: 0; }
                    }
                    .preserve-3d {
                        transform-style: preserve-3d;
                    }
                    .animate-spin-grid {
                        will-change: transform;
                        animation: spinGrid3D 70s linear infinite;
                    }
                    .daily-planet-globe {
                        transform-style: preserve-3d;
                        will-change: transform;
                        animation: spinDailyPlanet 18s linear infinite;
                    }
                    .daily-planet-logo-orbit {
                        transform-style: preserve-3d;
                        will-change: transform;
                        animation: spinLogoOrbit 10s linear infinite;
                    }
                    .rider-1 {
                        animation: riderRoute1 6s ease-in-out infinite;
                    }
                    .rider-2 {
                        animation: riderRoute2 7.5s ease-in-out infinite 2s;
                    }
                    .radar-ring {
                        animation: pulseRadar 3s ease-out infinite;
                    }
                                        @keyframes delivery1 {
                        0%, 100% { transform: translate(0px, 0px) translateZ(4px); opacity: 0; }
                        10% { opacity: 1; }
                        25% { transform: translate(0px, -216px) translateZ(4px); }
                        45% { transform: translate(-220px, -216px) translateZ(4px); }
                        55% { transform: translate(-220px, -216px) translateZ(4px); }
                        75% { transform: translate(0px, -216px) translateZ(4px); }
                        90% { opacity: 1; }
                    }
                    @keyframes delivery2 {
                        0%, 100% { transform: translate(0px, 0px) translateZ(4px); opacity: 0; }
                        10% { opacity: 1; }
                        25% { transform: translate(216px, 0px) translateZ(4px); }
                        45% { transform: translate(216px, -240px) translateZ(4px); }
                        55% { transform: translate(216px, -240px) translateZ(4px); }
                        75% { transform: translate(216px, 0px) translateZ(4px); }
                        90% { opacity: 1; }
                    }
                    @keyframes delivery3 {
                        0%, 100% { transform: translate(0px, 0px) translateZ(4px); opacity: 0; }
                        10% { opacity: 1; }
                        25% { transform: translate(-216px, 0px) translateZ(4px); }
                        45% { transform: translate(-216px, 230px) translateZ(4px); }
                        55% { transform: translate(-216px, 230px) translateZ(4px); }
                        75% { transform: translate(-216px, 0px) translateZ(4px); }
                        90% { opacity: 1; }
                    }
                    @keyframes delivery4 {
                        0%, 100% { transform: translate(0px, 0px) translateZ(4px); opacity: 0; }
                        10% { opacity: 1; }
                        25% { transform: translate(0px, 216px) translateZ(4px); }
                        45% { transform: translate(250px, 216px) translateZ(4px); }
                        55% { transform: translate(250px, 216px) translateZ(4px); }
                        75% { transform: translate(0px, 216px) translateZ(4px); }
                        90% { opacity: 1; }
                    }
                    @keyframes delivery5 {
                        0%, 100% { transform: translate(0px, 0px) translateZ(4px); opacity: 0; }
                        12% { opacity: 1; }
                        30% { transform: translate(-340px, 0px) translateZ(4px); }
                        48% { transform: translate(-340px, -180px) translateZ(4px); }
                        55% { transform: translate(-340px, -180px) translateZ(4px); }
                        75% { transform: translate(-340px, 0px) translateZ(4px); }
                        90% { opacity: 1; }
                    }
                    @keyframes delivery6 {
                        0%, 100% { transform: translate(0px, 0px) translateZ(4px); opacity: 0; }
                        12% { opacity: 1; }
                        30% { transform: translate(0px, -340px) translateZ(4px); }
                        48% { transform: translate(260px, -340px) translateZ(4px); }
                        55% { transform: translate(260px, -340px) translateZ(4px); }
                        75% { transform: translate(0px, -340px) translateZ(4px); }
                        90% { opacity: 1; }
                    }
                    @keyframes delivery7 {
                        0%, 100% { transform: translate(0px, 0px) translateZ(4px); opacity: 0; }
                        12% { opacity: 1; }
                        30% { transform: translate(0px, 340px) translateZ(4px); }
                        48% { transform: translate(-240px, 340px) translateZ(4px); }
                        55% { transform: translate(-240px, 340px) translateZ(4px); }
                        75% { transform: translate(0px, 340px) translateZ(4px); }
                        90% { opacity: 1; }
                    }
                    @keyframes delivery8 {
                        0%, 100% { transform: translate(0px, 0px) translateZ(4px); opacity: 0; }
                        12% { opacity: 1; }
                        30% { transform: translate(340px, 0px) translateZ(4px); }
                        48% { transform: translate(340px, 210px) translateZ(4px); }
                        55% { transform: translate(340px, 210px) translateZ(4px); }
                        75% { transform: translate(340px, 0px) translateZ(4px); }
                        90% { opacity: 1; }
                    }

                    .beam-1 { animation: delivery1 7.5s ease-in-out infinite 0s; }
                    .beam-2 { animation: delivery2 8.2s ease-in-out infinite 1.2s; }
                    .beam-3 { animation: delivery3 7.8s ease-in-out infinite 2.5s; }
                    .beam-4 { animation: delivery4 8.5s ease-in-out infinite 0.8s; }
                    .beam-5 { animation: delivery5 9.5s ease-in-out infinite 3.1s; }
                    .beam-6 { animation: delivery6 9.0s ease-in-out infinite 1.8s; }
                    .beam-7 { animation: delivery7 9.2s ease-in-out infinite 4.0s; }
                    .beam-8 { animation: delivery8 8.8s ease-in-out infinite 2.0s; }

                                    @keyframes spinBurger3D {
                        0%   { transform: rotateX(68deg) rotateZ(0deg); }
                        100% { transform: rotateX(68deg) rotateZ(360deg); }
                    }
                    .burger-3d-object {
                        transform-style: preserve-3d;
                        will-change: transform;
                        animation: spinBurger3D 10s linear infinite;
                    }



                `}</style>


            {/* =========================================================
                    ESCENA 3D DE FONDO (CUADRÍCULA VERDE + EDIFICIO SUCURSAL)
                ========================================================= */}
            <div
                className="absolute inset-0 lg:-left-[22%] flex items-center justify-center pointer-events-none"
                style={{ perspective: '1000px' }}
            >

                <div
                    className={`preserve-3d transition-all ease-in-out ${animandoEntrada ? 'duration-1000' : 'duration-300'
                        }`}
                    style={{
                        transform: animandoEntrada
                            ? 'scale(4.2) rotateX(45deg) rotateY(0deg) translateZ(120px)'
                            : `scale(1) rotateX(${62 - tilt.y}deg) rotateY(${tilt.x}deg)`,
                    }}
                >
                    {/* Plano de la Cuadrícula Verde (Sólido y sin reflejos inferiores) */}
                    <div
                        className="relative w-[900px] h-[900px] preserve-3d animate-spin-grid flex items-center justify-center"
                        style={{
                            backgroundColor: '#020705',
                            backgroundImage: `
                                    linear-gradient(to right, rgba(16, 185, 129, 0.25) 1px, transparent 1px),
                                    linear-gradient(to bottom, rgba(16, 185, 129, 0.25) 1px, transparent 1px)
                                `,
                            backgroundSize: '45px 45px',
                        }}
                    >

                        {/* Onda de radar */}
                        <div
                            className={`absolute w-36 h-36 rounded-full border radar-ring ${hayError ? 'border-rose-500/70' : 'border-emerald-400/60'
                                }`}
                        />

                        {/* HACES DE LUZ DE DELIVERY (IDA A RESIDENCIAS Y REGRESO A SUCURSAL) */}
                        <div className="absolute w-3 h-3 rounded-full bg-amber-300 shadow-[0_0_16px_4px_#fbbf24] beam-1" />
                        <div className="absolute w-3 h-3 rounded-full bg-emerald-300 shadow-[0_0_16px_4px_#34d399] beam-2" />
                        <div className="absolute w-3 h-3 rounded-full bg-rose-400 shadow-[0_0_16px_4px_#fb7185] beam-3" />
                        <div className="absolute w-3 h-3 rounded-full bg-amber-300 shadow-[0_0_16px_4px_#fbbf24] beam-4" />
                        <div className="absolute w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-[0_0_15px_4px_#67e8f9] beam-5" />
                        <div className="absolute w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_15px_4px_#f59e0b] beam-6" />
                        <div className="absolute w-2.5 h-2.5 rounded-full bg-emerald-300 shadow-[0_0_15px_4px_#34d399] beam-7" />
                        <div className="absolute w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_15px_4px_#f43f5e] beam-8" />


                        {/* TRAZADO VIAL: LÍNEAS CENTRALES DE AVENIDAS PRINCIPALES */}
                        {/* Avenida Norte-Sur */}
                        <div
                            className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] border-l-2 border-dashed border-emerald-400/45 pointer-events-none"
                            style={{ transform: 'translateZ(1px)' }}
                        />
                        {/* Avenida Este-Oeste */}
                        <div
                            className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] border-t-2 border-dashed border-emerald-400/45 pointer-events-none"
                            style={{ transform: 'translateZ(1px)' }}
                        />

                        {/* VEREDAS ELEVADAS Y CORDONES DE LAS 8 MANZANAS */}
                        {MANZANAS.map((m, i) => (
                            <div
                                key={`m-${i}`}
                                className="absolute bg-emerald-950/55 border-2 border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.12),inset_0_0_20px_rgba(16,185,129,0.1)]"
                                style={{
                                    left: `${m.x}px`,
                                    top: `${m.y}px`,
                                    width: `${m.w}px`,
                                    height: `${m.d}px`,
                                    transform: 'translateZ(2px)',
                                }}
                            >
                                {/* Línea interna de cordón de vereda */}
                                <div className="absolute inset-1.5 border border-emerald-500/20" />
                            </div>
                        ))}

                        {/* CASAS A DOS AGUAS, EDIFICIOS Y TORRES DENTRO DE CADA MANZANA */}
                        {CIUDAD.map((b, i) => {
                            const estiloVentanas =
                                b.tipo !== 'casa'
                                    ? {
                                        backgroundImage:
                                            'radial-gradient(rgba(52, 211, 153, 0.45) 1.5px, transparent 1.5px)',
                                        backgroundSize: '8px 10px',
                                    }
                                    : {}

                            const alturaTecho = 14
                            const mediaProfundidad = b.d / 2
                            const largoFalda = Math.hypot(mediaProfundidad, alturaTecho)
                            const anguloGrados = (Math.atan2(alturaTecho, mediaProfundidad) * 180) / Math.PI

                            return (
                                <div
                                    key={i}
                                    className="absolute preserve-3d"
                                    style={{
                                        left: `${b.x}px`,
                                        top: `${b.y}px`,
                                        width: `${b.w}px`,
                                        height: `${b.d}px`,
                                        transform: 'translateZ(2px)', // Apoyados sobre la vereda
                                    }}
                                >

                                    {/* Paredes base (4 caras con ventanas en edificios/torres) */}
                                    <div
                                        className="absolute bottom-0 left-0 bg-emerald-950/75 border border-emerald-400/50 origin-bottom"
                                        style={{ width: `${b.w}px`, height: `${b.h}px`, transform: 'rotateX(-90deg)', ...estiloVentanas }}
                                    />
                                    <div
                                        className="absolute top-0 left-0 bg-emerald-950/65 border border-emerald-400/40 origin-top"
                                        style={{ width: `${b.w}px`, height: `${b.h}px`, transform: 'rotateX(90deg)', ...estiloVentanas }}
                                    />
                                    <div
                                        className="absolute top-0 left-0 bg-emerald-950/70 border border-emerald-400/45 origin-left"
                                        style={{ width: `${b.h}px`, height: `${b.d}px`, transform: 'rotateY(90deg)', ...estiloVentanas }}
                                    />
                                    <div
                                        className="absolute top-0 right-0 bg-emerald-950/70 border border-emerald-400/45 origin-right"
                                        style={{ width: `${b.h}px`, height: `${b.d}px`, transform: 'rotateY(-90deg)', ...estiloVentanas }}
                                    />

                                    {/* TECHO SEGÚN TIPO DE CONSTRUCCIÓN */}
                                    {b.tipo === 'casa' ? (
                                        <div className="absolute inset-0 preserve-3d" style={{ transform: `translateZ(${b.h}px)` }}>
                                            {/* Falda delantera inclinada HACIA ARRIBA (-angulo) */}
                                            <div
                                                className="absolute bottom-0 left-0 w-full bg-emerald-700/80 border border-emerald-300/70 origin-bottom"
                                                style={{
                                                    height: `${largoFalda}px`,
                                                    transform: `rotateX(-${anguloGrados}deg)`,
                                                }}
                                            />
                                            {/* Falda trasera inclinada HACIA ARRIBA (+angulo) */}
                                            <div
                                                className="absolute top-0 left-0 w-full bg-emerald-800/80 border border-emerald-300/60 origin-top"
                                                style={{
                                                    height: `${largoFalda}px`,
                                                    transform: `rotateX(${anguloGrados}deg)`,
                                                }}
                                            />
                                            {/* Hastial triangular izquierdo (cierra el costado del techo) */}
                                            <div
                                                className="absolute top-0 left-0 bg-emerald-900/90 border-l border-emerald-400/60 origin-left"
                                                style={{
                                                    width: `${alturaTecho}px`,
                                                    height: `${b.d}px`,
                                                    clipPath: 'polygon(0% 0%, 100% 50%, 0% 100%)',
                                                    transform: 'rotateY(-90deg)',
                                                }}
                                            />
                                            {/* Hastial triangular derecho (cierra el otro costado) */}
                                            <div
                                                className="absolute top-0 right-0 bg-emerald-900/90 border-r border-emerald-400/60 origin-right"
                                                style={{
                                                    width: `${alturaTecho}px`,
                                                    height: `${b.d}px`,
                                                    clipPath: 'polygon(100% 0%, 0% 50%, 100% 100%)',
                                                    transform: 'rotateY(90deg)',
                                                }}
                                            />
                                        </div>
                                    ) : b.tipo === 'torre' ? (
                                        /* Torre con azotea + segundo módulo retranqueado con volumen 3D real */
                                        <div
                                            className="absolute inset-0 bg-emerald-950/85 border border-emerald-400/70 preserve-3d flex items-center justify-center"
                                            style={{ transform: `translateZ(${b.h}px)` }}
                                        >
                                            <div className="relative w-[56%] h-[56%] preserve-3d">
                                                {/* Techo del módulo superior */}
                                                <div
                                                    className="absolute inset-0 bg-emerald-800/80 border border-emerald-300/80 flex items-center justify-center preserve-3d"
                                                    style={{ transform: 'translateZ(18px)' }}
                                                >
                                                    {/* Baliza roja de aviación en la punta */}
                                                    <div
                                                        className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"
                                                        style={{ transform: 'translateZ(10px)' }}
                                                    />
                                                </div>
                                                {/* Paredes del módulo superior */}
                                                <div className="absolute bottom-0 left-0 w-full h-[18px] bg-emerald-600/30 border border-emerald-400/60 origin-bottom" style={{ transform: 'rotateX(-90deg)' }} />
                                                <div className="absolute top-0 left-0 w-full h-[18px] bg-emerald-600/20 border border-emerald-400/50 origin-top" style={{ transform: 'rotateX(90deg)' }} />
                                                <div className="absolute top-0 left-0 w-[18px] h-full bg-emerald-600/25 border border-emerald-400/55 origin-left" style={{ transform: 'rotateY(90deg)' }} />
                                                <div className="absolute top-0 right-0 w-[18px] h-full bg-emerald-600/25 border border-emerald-400/55 origin-right" style={{ transform: 'rotateY(-90deg)' }} />
                                            </div>
                                        </div>
                                    ) : (
                                        /* Edificio con pretil (borde elevado en la terraza) y equipo de aire acondicionado */
                                        <div
                                            className="absolute inset-0 bg-emerald-950/85 border-2 border-emerald-400/65 flex items-center justify-center preserve-3d"
                                            style={{ transform: `translateZ(${b.h}px)` }}
                                        >
                                            <div
                                                className="w-4 h-3 bg-emerald-800/80 border border-emerald-400/50"
                                                style={{ transform: 'translateZ(4px)' }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )
                        })}


                        {/* EDIFICIO PROTAGONISTA: SUCURSAL */}
                        {/* EDIFICIO PROTAGONISTA: SUCURSAL */}
                        <div className="relative w-[90px] h-[90px] preserve-3d">
                            {/* Vereda nítida de la manzana central (sin blur) */}
                            <div
                                className={`absolute -inset-3 border transition-colors duration-500 ${hayError
                                    ? 'bg-rose-950/40 border-rose-500/60'
                                    : 'bg-[#0a0404] border-red-500/50'
                                    }`}
                                style={{ transform: 'translateZ(1px)' }}
                            />


                            {/* Techo del Edificio con Cilindro Luminoso y Logo BurgerFast girando */}
                            <div
                                className={`absolute inset-0 bg-[#140505]/95 border-2 flex items-center justify-center preserve-3d transition-colors duration-500 ${hayError
                                    ? 'border-rose-500 shadow-[inset_0_0_20px_rgba(244,63,94,0.5)]'
                                    : 'border-red-500 shadow-[inset_0_0_20px_rgba(220,38,38,0.6)]'
                                    }`}
                                style={{ transform: 'translateZ(110px)' }}
                            >
                                {/* Pedestal en la azotea */}
                                <div className="relative w-12 h-12 rounded-full border-2 border-red-500/80 bg-[#1a0505] shadow-[0_0_15px_rgba(220,38,38,0.6)] flex items-center justify-center preserve-3d">

                                    {/* CILINDRO GIRATORIO CON EL LOGO BURGERFAST */}
                                    <div
                                        className="relative w-16 h-16 flex items-center justify-center preserve-3d burger-sphere-3d"
                                        style={{ transform: 'translateZ(24px)' }}
                                    >
                                        {/* Tapa superior del cilindro (Pan rojo brillante) */}
                                        <div
                                            className="absolute w-[54px] h-[54px] rounded-full bg-red-600 border-2 border-red-400 shadow-[0_0_16px_rgba(239,68,68,0.85)]"
                                            style={{ transform: 'translateZ(22px)' }}
                                        />

                                        {/* 16 Gajos ordenados de izquierda a derecha frente a la cámara */}
                                        {Array.from({ length: 16 }).map((_, idx) => {
                                            const angulo = idx * (360 / 16)
                                            const anchoGajo = 10.6
                                            const posX = idx * anchoGajo
                                            return (
                                                <div
                                                    key={idx}
                                                    className="absolute"
                                                    style={{
                                                        width: `${anchoGajo}px`,
                                                        height: '44px',
                                                        backgroundColor: '#120404',
                                                        backgroundImage: TEXTURA_ESFERA_SVG,
                                                        backgroundSize: '84.8px 38px',
                                                        backgroundPosition: `-${posX}px center`,
                                                        backgroundRepeat: 'repeat-x',
                                                        // Signo NEGATIVO en rotateZ para que las franjas se ordenen de izquierda a derecha
                                                        transform: `rotateZ(-${angulo}deg) rotateX(-90deg) translateZ(26px)`,
                                                        backfaceVisibility: 'hidden',
                                                    }}
                                                />
                                            )
                                        })}


                                        {/* Base inferior del cilindro (Pan blanco) */}
                                        <div
                                            className="absolute w-[54px] h-[54px] rounded-full bg-white border border-slate-200"
                                            style={{ transform: 'translateZ(-22px)' }}
                                        />
                                    </div>
                                </div>
                            </div>





                            {/* Cara Frontal */}
                            <div
                                className={`absolute bottom-0 left-0 w-[90px] h-[110px] bg-gradient-to-t from-emerald-500/30 to-emerald-400/10 border origin-bottom flex flex-col justify-between p-2 transition-colors duration-500 ${hayError ? 'border-rose-500/80' : 'border-emerald-400/80'
                                    }`}
                                style={{ transform: 'rotateX(-90deg)' }}
                            >
                                <div className="w-full h-1.5 bg-emerald-400/30 rounded-full" />
                                <div className="w-full h-1.5 bg-emerald-400/30 rounded-full" />
                                <div className="w-full h-1.5 bg-emerald-400/30 rounded-full" />
                                <div className="w-full h-5 border border-rose-500/80 bg-rose-500/20 flex items-center justify-center">
                                    <span className="text-[7px] font-bold tracking-widest text-rose-300">
                                        BURGERFAST
                                    </span>
                                </div>
                            </div>

                            {/* Cara Trasera */}
                            <div
                                className={`absolute top-0 left-0 w-[90px] h-[110px] bg-emerald-500/15 border origin-top ${hayError ? 'border-rose-500/60' : 'border-emerald-400/60'
                                    }`}
                                style={{ transform: 'rotateX(90deg)' }}
                            />

                            {/* Cara Izquierda */}
                            <div
                                className={`absolute top-0 left-0 w-[110px] h-[90px] bg-emerald-500/20 border origin-left ${hayError ? 'border-rose-500/70' : 'border-emerald-400/70'
                                    }`}
                                style={{ transform: 'rotateY(90deg)' }}
                            />

                            {/* Cara Derecha */}
                            <div
                                className={`absolute top-0 right-0 w-[110px] h-[90px] bg-emerald-500/20 border origin-right ${hayError ? 'border-rose-500/70' : 'border-emerald-400/70'
                                    }`}
                                style={{ transform: 'rotateY(-90deg)' }}
                            />

                            {/* Etiqueta flotante */}
                            <div className="absolute inset-0 flex items-center justify-center preserve-3d animate-label-billboard">
                                <div
                                    className={`px-2.5 py-1 rounded bg-emerald-950/90 border text-[10px] font-mono tracking-wider whitespace-nowrap transition-colors ${hayError
                                        ? 'border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.5)]'
                                        : 'border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                                        }`}
                                >
                                    {hayError
                                        ? '● ERROR DE ACCESO'
                                        : animandoEntrada
                                            ? '● CONECTANDO...'
                                            : '● SUCURSAL CENTRAL'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Viñeta radial */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        'radial-gradient(circle at 50% 55%, transparent 42%, #020705 95%)',
                }}
            />


            {/* Fundido oscuro final al hacer zoom */}
            <div
                className={`absolute inset-0 bg-[#020705] pointer-events-none transition-opacity duration-700 z-20 ${animandoEntrada ? 'opacity-100 delay-500' : 'opacity-0'
                    }`}
            />


            {/* =========================================================
                    COLUMNA DERECHA: LOGO + INGREDIENTES/HAMBURGUESA + FORM
                ========================================================= */}
            <div
                className={`relative z-10 w-full max-w-[420px] lg:max-w-[350px] mx-3 sm:mx-4 flex flex-col justify-between lg:justify-center h-full py-5 lg:py-0 lg:h-auto items-center transition-all duration-500 ${animandoEntrada
                    ? 'opacity-0 scale-95 pointer-events-none'
                    : 'opacity-100 scale-100'
                    }`}
            >
                <div className="w-full grid grid-cols-2 items-center lg:flex lg:flex-col lg:justify-center gap-2 lg:gap-0 mb-2 lg:mb-0">

                    {/* =========================================================
                    1. ANILLO DE INGREDIENTES + BOTÓN "CONECTAR" -> HAMBURGUESA 3D
                ========================================================= */}
                    {/* =========================================================
                    2. LOGO BURGERFAST (Se ilumina al conectar)
                ========================================================= */}
                    {/* 2. LOGO BURGERFAST (Se ilumina al conectar) */}
                    {/* 2. LOGO BURGERFAST (Se ilumina al conectar) */}
                    {/* 2. LOGO BURGERFAST (Se ilumina al conectar) */}
                    <div className="relative w-full h-40 sm:h-44 lg:h-auto flex items-center justify-center order-1 lg:order-2 lg:mt-2 lg:mb-10 pointer-events-none px-1">




                        <img src="/logo.png" alt="Logo BurgerFast" className="relative w-36 sm:w-44 lg:w-44 h-auto" />

                        {/* Destellos sobre el contorno del logo activos solo después de oprimir CONECTAR */}
                        {ensamblado && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <img
                                    src="/logo.png"
                                    alt=""
                                    aria-hidden="true"
                                    className="w-36 sm:w-44 lg:w-44 h-auto logo-active-glow"
                                    style={{
                                        filter: hayError
                                            ? 'brightness(0) invert(1) drop-shadow(0 0 3px #fb7185) drop-shadow(0 0 9px #f43f5e)'
                                            : 'brightness(0) invert(1) drop-shadow(0 0 3px #6ee7b7) drop-shadow(0 0 9px #10b981)',
                                    }}
                                />
                            </div>
                        )}
                    </div>




                    {/* 2. ANILLO DE INGREDIENTES + BOTÓN "CONECTAR" -> HAMBURGUESA 3D (Derecha en <lg, primero en lg:) */}
                    {/* 1. ANILLO DE INGREDIENTES + BOTÓN "CONECTAR" -> HAMBURGUESA 3D */}
                    <div className="relative w-full h-40 sm:h-44 lg:w-44 lg:h-40 flex items-center justify-center order-2 lg:order-1 lg:mb-2">


                        {/* Destello de energía al colapsar los ingredientes */}
                        {ensamblado && (
                            <div className="absolute w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-emerald-400/50 blur-xl pointer-events-none burger-fusion-flash" />
                        )}

                        {/* ESTADO A (Antes de conectar): Anillo de 6 ingredientes orbitando + Botón CONECTAR */}
                        {!ensamblado ? (
                            <div className="relative w-52 h-48 flex items-center justify-center scale-[0.82] sm:scale-[0.92] lg:scale-100 origin-center">

                                {/* Aro orbital luminoso */}
                                <div className="absolute inset-3 rounded-full border border-dashed border-emerald-400/35 shadow-[inset_0_0_20px_rgba(16,185,129,0.08)] pointer-events-none" />

                                {/* Anillo giratorio con los 6 ingredientes */}
                                <div className="absolute inset-0 ingredients-ring pointer-events-none">
                                    {[
                                        {
                                            label: 'Pan Superior',
                                            deg: 0,
                                            el: (
                                                <svg viewBox="0 0 80 54" className="w-16 h-11 drop-shadow-[0_6px_10px_rgba(0,0,0,0.85)]">
                                                    <defs>
                                                        <radialGradient id="bunTopReal" cx="35%" cy="28%" r="70%">
                                                            <stop offset="0%" stopColor="#fef3c7" />
                                                            <stop offset="35%" stopColor="#f59e0b" />
                                                            <stop offset="78%" stopColor="#b45309" />
                                                            <stop offset="100%" stopColor="#451a03" />
                                                        </radialGradient>
                                                    </defs>
                                                    <path d="M 6 38 C 6 10, 74 10, 74 38 C 74 44, 6 44, 6 38 Z" fill="url(#bunTopReal)" />
                                                    <ellipse cx="40" cy="39" rx="34" ry="5" fill="#78350f" opacity="0.7" />
                                                    <g fill="#fef9c3">
                                                        <ellipse cx="26" cy="21" rx="3" ry="1.3" transform="rotate(-20 26 21)" />
                                                        <ellipse cx="40" cy="17" rx="3" ry="1.3" transform="rotate(8 40 17)" />
                                                        <ellipse cx="54" cy="21" rx="3" ry="1.3" transform="rotate(22 54 21)" />
                                                        <ellipse cx="32" cy="28" rx="3" ry="1.3" transform="rotate(-10 32 28)" />
                                                        <ellipse cx="47" cy="28" rx="3" ry="1.3" transform="rotate(14 47 28)" />
                                                        <ellipse cx="20" cy="30" rx="2.6" ry="1.1" transform="rotate(-28 20 30)" />
                                                        <ellipse cx="60" cy="30" rx="2.6" ry="1.1" transform="rotate(28 60 30)" />
                                                    </g>
                                                </svg>
                                            ),
                                        },
                                        {
                                            label: 'Lechuga',
                                            deg: 60,
                                            el: (
                                                <svg viewBox="0 0 80 54" className="w-16 h-11 drop-shadow-[0_6px_10px_rgba(0,0,0,0.85)]">
                                                    <path d="M 6 31 C 10 18, 20 22, 28 15 C 37 8, 46 17, 55 13 C 64 9, 74 20, 73 30 C 72 40, 62 36, 54 41 C 45 46, 35 38, 26 42 C 17 46, 4 40, 6 31 Z" fill="#059669" />
                                                    <path d="M 10 29 C 14 19, 23 23, 30 17 C 38 11, 46 19, 54 15 C 62 12, 69 21, 68 29 C 66 36, 58 33, 51 37 C 43 41, 34 35, 26 38 C 18 41, 8 36, 10 29 Z" fill="#10b981" stroke="#6ee7b7" strokeWidth="1" />
                                                    <path d="M 16 30 Q 40 24 64 29 M 28 21 Q 36 27 40 35 M 50 20 Q 44 27 42 35" fill="none" stroke="#a7f3d0" strokeWidth="1.3" strokeLinecap="round" opacity="0.85" />
                                                </svg>
                                            ),
                                        },
                                        {
                                            label: 'Tomate',
                                            deg: 120,
                                            el: (
                                                <svg viewBox="0 0 80 54" className="w-16 h-11 drop-shadow-[0_6px_10px_rgba(0,0,0,0.85)]">
                                                    <ellipse cx="40" cy="30" rx="31" ry="15" fill="#7f1d1d" />
                                                    <ellipse cx="40" cy="26" rx="31" ry="14" fill="#ef4444" stroke="#fca5a5" strokeWidth="1.2" />
                                                    <ellipse cx="40" cy="26" rx="25" ry="10.5" fill="#dc2626" />
                                                    <ellipse cx="27" cy="23" rx="6" ry="3" fill="#991b1b" />
                                                    <ellipse cx="53" cy="23" rx="6" ry="3" fill="#991b1b" />
                                                    <ellipse cx="28" cy="30" rx="6" ry="3" fill="#991b1b" />
                                                    <ellipse cx="52" cy="30" rx="6" ry="3" fill="#991b1b" />
                                                    <g fill="#fef08a">
                                                        <ellipse cx="25" cy="23" rx="2" ry="1" />
                                                        <ellipse cx="29" cy="23" rx="2" ry="1" />
                                                        <ellipse cx="51" cy="23" rx="2" ry="1" />
                                                        <ellipse cx="55" cy="23" rx="2" ry="1" />
                                                        <ellipse cx="26" cy="30" rx="2" ry="1" />
                                                        <ellipse cx="30" cy="30" rx="2" ry="1" />
                                                        <ellipse cx="50" cy="30" rx="2" ry="1" />
                                                        <ellipse cx="54" cy="30" rx="2" ry="1" />
                                                    </g>
                                                </svg>
                                            ),

                                        },
                                        {
                                            label: 'Cheddar',
                                            deg: 180,
                                            el: (
                                                <svg viewBox="0 0 80 54" className="w-16 h-11 drop-shadow-[0_6px_10px_rgba(0,0,0,0.85)]">
                                                    <polygon points="8,24 40,42 40,47 8,29" fill="#b45309" />
                                                    <polygon points="72,24 40,42 40,47 72,29" fill="#92400e" />
                                                    <polygon points="40,9 72,24 40,42 8,24" fill="#fbbf24" stroke="#fef08a" strokeWidth="1.2" />
                                                    <polygon points="40,12 60,22 40,32 20,22" fill="#fde047" opacity="0.45" />
                                                </svg>
                                            ),
                                        },
                                        {
                                            label: 'Carne',
                                            deg: 240,
                                            el: (
                                                <svg viewBox="0 0 80 54" className="w-16 h-11 drop-shadow-[0_6px_10px_rgba(0,0,0,0.85)]">
                                                    <path d="M 8 24 L 8 34 C 8 44, 72 44, 72 34 L 72 24 Z" fill="#270b02" />
                                                    <ellipse cx="40" cy="24" rx="32" ry="13" fill="#5c2409" stroke="#78350f" strokeWidth="1.2" />
                                                    <path d="M 20 19 L 31 30 M 32 17 L 44 31 M 45 17 L 56 30 M 56 20 L 63 27" stroke="#180601" strokeWidth="3" strokeLinecap="round" />
                                                    <ellipse cx="34" cy="21" rx="8" ry="2.5" fill="#9a3412" opacity="0.5" />
                                                </svg>
                                            ),
                                        },
                                        {
                                            label: 'Pan Inferior',
                                            deg: 300,
                                            el: (
                                                <svg viewBox="0 0 80 54" className="w-16 h-11 drop-shadow-[0_6px_10px_rgba(0,0,0,0.85)]">
                                                    <defs>
                                                        <linearGradient id="bottomCrustGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                                            <stop offset="0%" stopColor="#78350f" />
                                                            <stop offset="30%" stopColor="#b45309" />
                                                            <stop offset="70%" stopColor="#d97706" />
                                                            <stop offset="100%" stopColor="#78350f" />
                                                        </linearGradient>
                                                    </defs>
                                                    <path d="M 8 24 L 8 33 C 8 44, 72 44, 72 33 L 72 24 Z" fill="url(#bottomCrustGrad)" />
                                                    <ellipse cx="40" cy="24" rx="32" ry="12" fill="#d97706" />
                                                    <ellipse cx="40" cy="24" rx="28.5" ry="10" fill="#fde68a" />
                                                    <ellipse cx="40" cy="24" rx="20" ry="6.5" fill="#f59e0b" opacity="0.45" />
                                                    <g fill="#b45309" opacity="0.45">
                                                        <circle cx="27" cy="23" r="1.2" />
                                                        <circle cx="34" cy="21" r="0.9" />
                                                        <circle cx="45" cy="22" r="1.3" />
                                                        <circle cx="52" cy="24" r="1" />
                                                        <circle cx="39" cy="26" r="1.1" />
                                                        <circle cx="31" cy="26" r="0.8" />
                                                        <circle cx="48" cy="26" r="0.9" />
                                                    </g>
                                                </svg>
                                            ),
                                        },
                                    ].map((item) => (
                                        <div
                                            key={item.deg}
                                            className="absolute inset-0 flex items-start justify-center"
                                            style={{ transform: `rotate(${item.deg}deg)` }}
                                        >
                                            <div className="-mt-2 ingredient-upright">
                                                {item.el}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Botón CONECTAR en el centro exacto */}
                                <button
                                    type="button"
                                    onClick={() => setEnsamblado(true)}
                                    className="relative z-10 px-4 py-1.5 rounded-full bg-[#04140e]/90 hover:bg-emerald-500/20 border border-emerald-400/75 text-[11px] font-mono font-bold tracking-widest text-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.45)] hover:scale-105 active:scale-95 transition cursor-pointer"
                                >
                                    CONECTAR
                                </button>
                            </div>
                        ) : (
                            /* ESTADO B (Al oprimir CONECTAR): Aparece la Hamburguesa 3D completa girando */
                            /* ESTADO B (Al oprimir CONECTAR): Hamburguesa 3D completa girando + Líneas HUD de ingredientes */
                            <div
                                className="relative w-36 h-32 flex items-center justify-center pointer-events-none animate-[fadeIn_0.4s_ease-out] scale-95 sm:scale-105 lg:scale-100 origin-center translate-y-4 lg:translate-y-0"
                                style={{ perspective: '750px' }}
                            >
                                {/* =========================================================
                                    CONECTORES ORTOGONALES (90°) SOLO EN ESCRITORIO (lg:)
                                    Puntitos arrimados al borde exacto de cada ingrediente
                                ========================================================= */}
                                <div className="hidden lg:block absolute -inset-x-36 -inset-y-4 pointer-events-none z-20">

                                    {/* 1. PAN SÉSAMO (Arriba Izquierda -> Cúpula superior) */}
                                    <div className="flex items-start absolute top-[6px] left-2 animate-[fadeIn_0.5s_ease-out_0.15s_both]">
                                        <span className="px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-400/60 text-[10px] font-mono tracking-wider text-emerald-300 whitespace-nowrap shadow-[0_0_10px_rgba(16,185,129,0.25)]">
                                            PAN DE SÉSAMO
                                        </span>
                                        <svg className="w-[78px] h-6 overflow-visible mt-[9px]" viewBox="0 0 78 24" fill="none">
                                            <path d="M 0 0 H 32 V 11 H 75" stroke="#34d399" strokeWidth="1.3" strokeOpacity="0.9" />
                                            <circle cx="75" cy="11" r="2.3" fill="#6ee7b7" />
                                        </svg>
                                    </div>

                                    {/* 2. LECHUGA (Arriba Derecha -> Aro verde ondulado) */}
                                    <div className="flex items-start absolute top-[15px] right-4 animate-[fadeIn_0.5s_ease-out_0.25s_both]">
                                        <svg className="w-[82px] h-6 overflow-visible mt-[9px]" viewBox="0 0 82 24" fill="none">
                                            <path d="M 82 0 H 52 V 17 H 3" stroke="#34d399" strokeWidth="1.3" strokeOpacity="0.9" />
                                            <circle cx="3" cy="17" r="2.3" fill="#6ee7b7" />
                                        </svg>
                                        <span className="px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-400/60 text-[10px] font-mono tracking-wider text-emerald-300 whitespace-nowrap shadow-[0_0_10px_rgba(16,185,129,0.25)]">
                                            LECHUGA
                                        </span>
                                    </div>

                                    {/* 3. TOMATE (Medio Izquierda -> Rodaja roja) */}
                                    <div className="flex items-center absolute top-[35px] left-5 animate-[fadeIn_0.5s_ease-out_0.35s_both]">
                                        <span className="px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-400/60 text-[10px] font-mono tracking-wider text-emerald-300 whitespace-nowrap shadow-[0_0_10px_rgba(16,185,129,0.25)]">
                                            TOMATE
                                        </span>
                                        <svg className="w-[86px] h-2 overflow-visible" viewBox="0 0 86 8" fill="none">
                                            <path d="M 0 4 H 83" stroke="#34d399" strokeWidth="1.3" strokeOpacity="0.9" />
                                            <circle cx="83" cy="4" r="2.3" fill="#6ee7b7" />
                                        </svg>
                                    </div>

                                    {/* 4. DOBLE CHEDDAR (Medio Derecha -> Queso entre las carnes) */}
                                    <div className="flex items-center absolute top-[56px] -right-1 animate-[fadeIn_0.5s_ease-out_0.45s_both]">
                                        <svg className="w-[72px] h-2 overflow-visible" viewBox="0 0 72 8" fill="none">
                                            <path d="M 72 4 H 3" stroke="#34d399" strokeWidth="1.3" strokeOpacity="0.9" />
                                            <circle cx="3" cy="4" r="2.3" fill="#6ee7b7" />
                                        </svg>
                                        <span className="px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-400/60 text-[10px] font-mono tracking-wider text-emerald-300 whitespace-nowrap shadow-[0_0_10px_rgba(16,185,129,0.25)]">
                                            DOBLE CHEDDAR
                                        </span>
                                    </div>


                                    {/* 5. DOBLE CARNE (Abajo Izquierda -> Medallones) */}
                                    <div className="flex items-end absolute top-[62px] left-0 animate-[fadeIn_0.5s_ease-out_0.55s_both]">
                                        <span className="px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-400/60 text-[10px] font-mono tracking-wider text-emerald-300 whitespace-nowrap shadow-[0_0_10px_rgba(16,185,129,0.25)]">
                                            DOBLE CARNE
                                        </span>
                                        <svg className="w-[76px] h-6 overflow-visible mb-[9px]" viewBox="0 0 76 24" fill="none">
                                            <path d="M 0 24 H 30 V 11 H 73" stroke="#34d399" strokeWidth="1.3" strokeOpacity="0.9" />
                                            <circle cx="73" cy="11" r="2.3" fill="#6ee7b7" />
                                        </svg>
                                    </div>

                                </div>




                                <div
                                    className="absolute w-24 h-24 rounded-full bg-amber-500/20 blur-xl"
                                    style={{ transform: 'rotateX(68deg) translateZ(-12px)' }}
                                />

                                <div className="relative w-20 h-20 flex items-center justify-center burger-3d-object">
                                    {/* 1. PAN INFERIOR */}
                                    <div
                                        className="absolute w-[76px] h-[76px] rounded-full bg-amber-800 border border-amber-500/60"
                                        style={{ transform: 'translateZ(0px)' }}
                                    />
                                    {Array.from({ length: 16 }).map((_, i) => (
                                        <div
                                            key={`pb-${i}`}
                                            className="absolute w-[15.5px] h-[10px] bg-gradient-to-b from-amber-500 via-amber-600 to-amber-900 border-x border-amber-400/20"
                                            style={{
                                                transform: `rotateZ(${i * 22.5}deg) rotateX(-90deg) translateZ(37px) translateY(-5px)`,
                                            }}
                                        />
                                    ))}

                                    {/* 2. PRIMER MEDALLÓN */}
                                    {Array.from({ length: 16 }).map((_, i) => (
                                        <div
                                            key={`m1-${i}`}
                                            className="absolute w-[16.2px] h-[11px] border-x border-black/40"
                                            style={{
                                                background: 'linear-gradient(180deg, #6b2c0a 0%, #3d1604 55%, #1c0901 100%)',
                                                transform: `rotateZ(${i * 22.5}deg) rotateX(-90deg) translateZ(39px) translateY(-15.5px)`,
                                            }}
                                        />
                                    ))}

                                    {/* 3. PRIMER CHEDDAR */}
                                    <div
                                        className="absolute w-[64px] h-[64px] rounded-[4px] bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 border border-yellow-200/90 shadow-[0_0_12px_rgba(251,191,36,0.55)]"
                                        style={{ transform: 'translateZ(21.5px) rotateZ(22deg)' }}
                                    />

                                    {/* 4. SEGUNDO MEDALLÓN */}
                                    {Array.from({ length: 16 }).map((_, i) => (
                                        <div
                                            key={`m2-${i}`}
                                            className="absolute w-[16.2px] h-[11px] border-x border-black/40"
                                            style={{
                                                background: 'linear-gradient(180deg, #73300c 0%, #421805 55%, #1f0a01 100%)',
                                                transform: `rotateZ(${i * 22.5}deg) rotateX(-90deg) translateZ(39px) translateY(-27.5px)`,
                                            }}
                                        />
                                    ))}

                                    {/* 5. SEGUNDO CHEDDAR */}
                                    <div
                                        className="absolute w-[64px] h-[64px] rounded-[4px] bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-300 border border-yellow-100 shadow-[0_0_12px_rgba(251,191,36,0.65)]"
                                        style={{ transform: 'translateZ(33.5px) rotateZ(67deg)' }}
                                    />

                                    {/* 6. TOMATE */}
                                    <div
                                        className="absolute w-[74px] h-[74px] rounded-full border-[5px] border-red-500 bg-red-600/35 shadow-[0_0_10px_rgba(239,68,68,0.6)]"
                                        style={{ transform: 'translateZ(35px)' }}
                                    />

                                    {/* 7. LECHUGA */}
                                    <div
                                        className="absolute w-[84px] h-[84px] rounded-full border-[5px] border-dashed border-emerald-400 bg-emerald-500/30 shadow-[0_0_14px_rgba(52,211,153,0.65)]"
                                        style={{ transform: 'translateZ(37px)' }}
                                    />

                                    {/* 8. PAN SUPERIOR */}
                                    {Array.from({ length: 16 }).map((_, i) => (
                                        <div
                                            key={`pt-${i}`}
                                            className="absolute w-[15.5px] h-[11px] bg-gradient-to-t from-amber-600 via-amber-500 to-amber-400 border-x border-amber-300/25"
                                            style={{
                                                transform: `rotateZ(${i * 22.5}deg) rotateX(-90deg) translateZ(37px) translateY(-43.5px)`,
                                            }}
                                        />
                                    ))}
                                    <div
                                        className="absolute w-[72px] h-[72px] rounded-full bg-amber-500 border border-amber-300/70"
                                        style={{ transform: 'translateZ(49px)' }}
                                    />
                                    <div
                                        className="absolute w-[60px] h-[60px] rounded-full bg-amber-400 border border-amber-200/80"
                                        style={{ transform: 'translateZ(53px)' }}
                                    />
                                    <div
                                        className="absolute w-[46px] h-[46px] rounded-full flex flex-wrap items-center justify-center gap-1.5 p-2 shadow-[0_0_16px_rgba(251,191,36,0.6)]"
                                        style={{
                                            background: 'radial-gradient(circle at 35% 30%, #fef08a, #f59e0b 65%, #b45309)',
                                            transform: 'translateZ(56px)',
                                        }}
                                    >
                                        <span className="w-1.5 h-0.5 rounded-full bg-amber-50 rotate-12" />
                                        <span className="w-1.5 h-0.5 rounded-full bg-amber-50 -rotate-45" />
                                        <span className="w-1.5 h-0.5 rounded-full bg-amber-50 rotate-45" />
                                        <span className="w-1.5 h-0.5 rounded-full bg-amber-50 -rotate-12" />
                                        <span className="w-1.5 h-0.5 rounded-full bg-amber-50 rotate-90" />
                                        <span className="w-1.5 h-0.5 rounded-full bg-amber-50 -rotate-30" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* =========================================================
                    3. MENSAJE ADMINISTRATIVO INICIAL -> DESPLIEGUE DEL FORM
                ========================================================= */}
                <div className="w-full my-auto lg:my-0">
                    {!ensamblado ? (
                        <div className="w-full text-center px-2 mt-2 animate-[fadeIn_0.5s_ease-out]">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[11px] font-medium mb-3.5 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="7" height="7" rx="1" />
                                    <rect x="14" y="3" width="7" height="7" rx="1" />
                                    <rect x="14" y="14" width="7" height="7" rx="1" />
                                    <rect x="3" y="14" width="7" height="7" rx="1" />
                                </svg>
                                <span>Sistema Central</span>
                            </div>

                            <h2 className="text-2xl font-bold tracking-tight text-white leading-tight mb-1.5 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                                Administración
                            </h2>

                            <p className="text-sm text-slate-300 leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.95)]">
                                Gestión y control en un solo lugar.
                            </p>
                        </div>
                    ) : (
                        <div
                            className={`relative w-full p-5 sm:p-6 rounded-2xl border text-slate-100 transition-all duration-500 animate-[fadeIn_0.45s_ease-out] ${transparente
                                    ? 'bg-transparent'
                                    : 'bg-black/45 backdrop-blur-md shadow-[0_15px_40px_rgba(0,0,0,0.55)]'
                                } ${hayError ? 'border-rose-500/50' : 'border-emerald-500/35'}`}
                        >


                            {/* Haz luminoso recorriendo el perímetro del formulario continuamente */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                                <defs>
                                    <filter id="formBeamGlow" x="-30%" y="-30%" width="160%" height="160%">
                                        <feGaussianBlur stdDeviation="3.5" result="blur1" />
                                        <feGaussianBlur stdDeviation="8" result="blur2" />
                                        <feMerge>
                                            <feMergeNode in="blur2" />
                                            <feMergeNode in="blur1" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>
                                <rect
                                    x="0"
                                    y="0"
                                    width="100%"
                                    height="100%"
                                    rx="16"
                                    ry="16"
                                    pathLength={100}
                                    fill="none"
                                    stroke={hayError ? '#fb7185' : '#6ee7b7'}
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    filter="url(#formBeamGlow)"
                                    className="bolt-perimeter-active"
                                />
                            </svg>

                            {/* Encabezado con el ícono de capas + Administración + Subtítulo */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polygon points="12 2 2 7 12 12 22 7 12 2" />
                                            <polyline points="2 17 12 22 22 17" />
                                            <polyline points="2 12 12 17 22 12" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-bold tracking-tight text-white leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                                            Administración
                                        </h1>
                                        <p className="text-[11px] text-slate-300 mt-1">
                                            Iniciá sesión para continuar
                                        </p>
                                    </div>
                                </div>

                                                                {/* Columna derecha: Badge ONLINE arriba + Checkbox Transparente debajo */}
                                <div className="shrink-0 flex flex-col items-end gap-1.5">
                                    <div
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-mono tracking-wider transition-colors ${
                                            hayError
                                                ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                                                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                                        }`}
                                    >
                                        <span
                                            className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                                                hayError
                                                    ? 'bg-rose-500'
                                                    : conectadoServidor
                                                    ? 'bg-emerald-400'
                                                    : 'bg-amber-400'
                                            }`}
                                        />
                                        {hayError ? 'ERROR' : conectadoServidor ? 'ONLINE' : '...'}
                                    </div>

                                    <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-[10px] font-mono text-slate-300 hover:text-emerald-300 transition">
                                        <input
                                            type="checkbox"
                                            checked={transparente}
                                            onChange={(e) => setTransparente(e.target.checked)}
                                            className="w-3 h-3 rounded border-emerald-400/50 bg-black/40 accent-emerald-500 cursor-pointer"
                                        />
                                        <span>Transparente</span>
                                    </label>
                                </div>
                            </div>


                            <form onSubmit={handleSubmit} className="space-y-3 bg-transparent">
                                <div>
                                    <label className="block text-xs font-medium text-slate-100 mb-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">
                                        Correo electrónico
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="admin@burgerfast.com"
                                        required
                                        disabled={cargando || animandoEntrada}
                                        className="w-full px-3 py-2 rounded-lg bg-transparent border border-emerald-400/40 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-300 transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-100 mb-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">
                                        Contraseña
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={mostrarPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            disabled={cargando || animandoEntrada}
                                            className="w-full px-3 py-2 pr-12 rounded-lg bg-transparent border border-emerald-400/40 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-300 transition"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setMostrarPassword(!mostrarPassword)}
                                            tabIndex={-1}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-200 hover:text-emerald-300 text-xs transition cursor-pointer"
                                        >
                                            {mostrarPassword ? 'Ocultar' : 'Ver'}
                                        </button>
                                    </div>
                                </div>
                               

                                {error && (
                                    <div className="p-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs text-center">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={cargando || animandoEntrada}
                                    className="w-full mt-1 py-2 px-4 rounded-lg bg-rose-600/90 hover:bg-rose-500 disabled:opacity-60 active:scale-[0.99] text-white text-sm font-semibold shadow-[0_0_20px_rgba(225,29,72,0.45)] transition cursor-pointer"
                                >
                                    {animandoEntrada
                                        ? 'Conectando...'
                                        : cargando
                                            ? 'Verificando...'
                                            : 'Iniciar sesión'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}



