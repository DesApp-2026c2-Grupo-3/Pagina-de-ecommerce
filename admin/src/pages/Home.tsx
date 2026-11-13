import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import type { AdministradorSesion } from '../types/sesion.types'
import { iniciarSesion as iniciarSesionApi } from '../services/authService'
import { useAuth } from '../context/AuthContext'

const LOGO_EMPRESA_URL = '/logo.png'

export default function Home2() {
    const navigate = useNavigate()
    const { iniciarSesion } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [mostrarPassword, setMostrarPassword] = useState(false)
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(false)
    const [conectadoServidor, setConectadoServidor] = useState(false)

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

            iniciarSesion(sesion)
            navigate('/admin')
        } catch {
            setError('Email o contraseña incorrectos')
        } finally {
            setCargando(false)
        }
    }

    return (
        <main className="relative h-screen w-full overflow-hidden flex flex-col justify-end select-none bg-sky-200">
            {/* =========================================================
          ESTILOS Y ANIMACIONES (OPTIMIZADO PARA PANTALLA LG)
      ========================================================= */}
            <style>{`
        @keyframes cicloCieloGlobal {
          0%, 36% {
            background: linear-gradient(180deg, #0284c7 0%, #7dd3fc 52%, #fef3c7 100%);
          }
          48% {
            background: linear-gradient(180deg, #1e3a8a 0%, #9a3412 55%, #f59e0b 100%);
          }
          58%, 88% {
            background: linear-gradient(180deg, #030712 0%, #0b132b 58%, #17203f 100%);
          }
          100% {
            background: linear-gradient(180deg, #0284c7 0%, #7dd3fc 52%, #fef3c7 100%);
          }
        }

        .cielo-global {
          animation: cicloCieloGlobal 26s ease-in-out infinite;
        }

        @keyframes cicloSol {
          0%, 38% { opacity: 1; transform: translateY(0px) scale(1); }
          50%, 92% { opacity: 0; transform: translateY(25px) scale(0.85); }
          100% { opacity: 1; transform: translateY(0px) scale(1); }
        }

        @keyframes cicloNocheAstros {
          0%, 48% { opacity: 0; transform: translateY(18px); }
          58%, 88% { opacity: 1; transform: translateY(0px); }
          100% { opacity: 0; transform: translateY(18px); }
        }

        .sol-pleno { animation: cicloSol 26s ease-in-out infinite; }
        .astros-noche { animation: cicloNocheAstros 26s ease-in-out infinite; }

        /* Luces amarillas recorriendo el perímetro de ABIERTO 24 HORAS */
        @keyframes lucesPerimetroMarquesina {
          0% { stroke-dashoffset: 36; }
          100% { stroke-dashoffset: 0; }
        }

        @keyframes resplandorMarquesina {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(250, 204, 21, 0.9)); }
          50% { filter: drop-shadow(0 0 18px rgba(250, 204, 21, 1)) drop-shadow(0 0 26px rgba(239, 68, 68, 0.95)); }
        }

        .marquesina-perimetro-luces {
          stroke-dasharray: 4 8;
          animation: lucesPerimetroMarquesina 1.1s linear infinite;
        }

        .cartel-abierto-glow {
          animation: resplandorMarquesina 2.4s ease-in-out infinite;
        }

        /* LEDs verdes de torres verticales de servidores */
        @keyframes ledServidorVerde {
          0%, 100% { opacity: 1; fill: #22c55e; }
          45% { opacity: 0.25; fill: #15803d; }
          70% { opacity: 0.95; fill: #4ade80; }
        }

        .led-srv-1 { animation: ledServidorVerde 1.1s infinite; }
        .led-srv-2 { animation: ledServidorVerde 1.7s infinite 0.3s; }
        .led-srv-3 { animation: ledServidorVerde 0.9s infinite 0.6s; }
        .led-srv-4 { animation: ledServidorVerde 1.4s infinite 0.15s; }

        /* Gráficos estadísticos dinámicos en el monitor del gerente */
        @keyframes barraEstadistica {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.55); }
        }

        .stat-bar-1 { transform-origin: bottom; animation: barraEstadistica 2.2s ease-in-out infinite; }
        .stat-bar-2 { transform-origin: bottom; animation: barraEstadistica 1.8s ease-in-out infinite 0.4s; }
        .stat-bar-3 { transform-origin: bottom; animation: barraEstadistica 2.5s ease-in-out infinite 0.8s; }
        .stat-bar-4 { transform-origin: bottom; animation: barraEstadistica 1.6s ease-in-out infinite 0.2s; }

        /* Pulso viajando por el cable entre oficina y servidores */
        @keyframes flujoCableDatos {
          0% { stroke-dashoffset: 48; }
          100% { stroke-dashoffset: 0; }
        }

        .cable-datos-activo {
          stroke-dasharray: 8 16;
          animation: flujoCableDatos 1.1s linear infinite;
        }

        /* Formulario más transparente con blur muy suave */
        @keyframes formTransparenteCiclo {
          0%, 40% {
            background: rgba(15, 23, 42, 0.24);
            border-color: rgba(250, 204, 21, 0.85);
          }
          54%, 88% {
            background: rgba(9, 13, 22, 0.34);
            border-color: rgba(74, 222, 128, 0.75);
          }
          100% {
            background: rgba(15, 23, 42, 0.24);
            border-color: rgba(250, 204, 21, 0.85);
          }
        }

        .server-form-glass {
          animation: formTransparenteCiclo 26s ease-in-out infinite;
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
        }

        /* Luz interior salón y nubes */
        @keyframes luzInteriorLocal {
          0%, 44% { opacity: 0.24; }
          56%, 88% { opacity: 0.82; }
          100% { opacity: 0.24; }
        }

        .luz-lampara-salon { animation: luzInteriorLocal 26s ease-in-out infinite; }

        @keyframes deslizarNube {
          0% { transform: translateX(-180px); }
          100% { transform: translateX(110vw); }
        }

        .nube-1 { animation: deslizarNube 42s linear infinite; }
        .nube-2 { animation: deslizarNube 58s linear infinite; animation-delay: -18s; }

        /* Humo de la chimenea sobre la cocina */
        @keyframes humoChimenea {
          0% { opacity: 0; transform: translate(50px, 0px) scale(0.75); }
          35% { opacity: 0.65; }
          100% { opacity: 0; transform: translate(18px, -38px) scale(1.65); }
        }

        .humo-chim-1 { animation: humoChimenea 3.2s ease-out infinite; }
        .humo-chim-2 { animation: humoChimenea 3.2s ease-out infinite 1.1s; }
        .humo-chim-3 { animation: humoChimenea 3.2s ease-out infinite 2.2s; }

        /* Animaciones de personajes planta baja */
        @keyframes caminarDeposito {
          0%, 100% { transform: translateX(0px); }
          45%, 55% { transform: translateX(46px); }
        }
        .empleado-deposito-move { animation: caminarDeposito 5.8s ease-in-out infinite; }

        @keyframes girarEspatula {
          0%, 100% { transform: rotate(0deg); }
          35% { transform: rotate(-14deg); }
          70% { transform: rotate(6deg); }
        }
        .cocinero-brazo {
          transform-box: fill-box;
          transform-origin: 10% 50%;
          animation: girarEspatula 2.1s ease-in-out infinite;
        }

        @keyframes agitarCanasto {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-5px) rotate(-6deg); }
          55% { transform: translateY(-1px) rotate(3deg); }
          80% { transform: translateY(-4px) rotate(-4deg); }
        }
        .freidora-brazo {
          transform-box: fill-box;
          transform-origin: 10% 50%;
          animation: agitarCanasto 1.7s ease-in-out infinite;
        }

        @keyframes subirVapor {
          0% { opacity: 0; transform: translateY(2px) scale(0.85); }
          45% { opacity: 0.7; }
          100% { opacity: 0; transform: translateY(-22px) scale(1.2); }
        }
        .vapor-1 { animation: subirVapor 2.5s ease-out infinite; }
        .vapor-2 { animation: subirVapor 2.5s ease-out infinite 0.8s; }
        .vapor-3 { animation: subirVapor 2.5s ease-out infinite 1.6s; }

        @keyframes llevarBocado {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-18deg); }
        }
        .cliente-brazo-comer {
          transform-box: fill-box;
          transform-origin: 10% 80%;
          animation: llevarBocado 3.4s ease-in-out infinite;
        }
        .cliente-brazo-beber {
          transform-box: fill-box;
          transform-origin: 90% 80%;
          animation: llevarBocado 4s ease-in-out infinite 1.4s;
        }

        /* Recorrido del repartidor en moto (día y noche) */
        @keyframes rutaRepartidorDiaNoche {
          0%, 12% {
            transform: translate(1078px, 128px);
            opacity: 1;
          }
          21% {
            transform: translate(1420px, 128px);
            opacity: 1;
          }
          21.5% {
            transform: translate(1420px, 128px);
            opacity: 0;
          }
          22% {
            transform: translate(-180px, 128px);
            opacity: 0;
          }
          23% {
            transform: translate(-180px, 128px);
            opacity: 1;
          }
          38%, 62% {
            transform: translate(1078px, 128px);
            opacity: 1;
          }
          71% {
            transform: translate(1420px, 128px);
            opacity: 1;
          }
          71.5% {
                    transform: translate(1420px, 128px);
            opacity: 0;
          }
          72% {
            transform: translate(-180px, 128px);
            opacity: 0;
          }
          73% {
            transform: translate(-180px, 128px);
            opacity: 1;
          }
          88%, 100% {
            transform: translate(1078px, 128px);
            opacity: 1;
          }
        }

        .moto-delivery-ruta {
          animation: rutaRepartidorDiaNoche 26s ease-in-out infinite;
        }
      `}</style>

            {/* =========================================================
          FONDO DEL CIELO + SOL Y MEDIALUNA EN MARGEN SUPERIOR DERECHO
      ========================================================= */}
            <div className="cielo-global fixed inset-0 z-0 pointer-events-none" />

            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="astros-noche absolute inset-0">
                    <svg className="w-full h-full" xmlns="http://w3.org">
                        <circle cx="8%" cy="11%" r="1.4" fill="#ffffff" opacity="0.9" />
                        <circle cx="18%" cy="7%" r="1" fill="#fef08a" opacity="0.7" />
                        <circle cx="29%" cy="15%" r="1.6" fill="#ffffff" opacity="0.85" />
                        <circle cx="42%" cy="8%" r="1.2" fill="#bae6fd" opacity="0.8" />
                        <circle cx="62%" cy="10%" r="1.5" fill="#ffffff" opacity="0.9" />
                        <circle cx="74%" cy="16%" r="1.1" fill="#fef08a" opacity="0.75" />
                        <circle cx="83%" cy="8%" r="1.4" fill="#ffffff" opacity="0.85" />
                    </svg>

                    <div className="absolute top-4 right-6">
                        <svg width="64" height="64" viewBox="0 0 84 84" fill="none">
                            <circle cx="42" cy="42" r="36" fill="#fef08a" opacity="0.18" />
                            <path
                                d="M52 14C36.536 14 24 26.536 24 42C24 57.464 36.536 70 52 70C56.23 70 60.24 69.06 63.84 67.38C53.25 65.17 45.3 55.78 45.3 44.5C45.3 31.63 55.73 21.2 68.6 21.2C69.07 21.2 69.54 21.21 70 21.24C65.24 16.74 58.93 14 52 14Z"
                                fill="#fef08a"
                            />
                        </svg>
                    </div>
                </div>

                <div className="sol-pleno absolute top-4 right-6">
                    <div className="relative flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-amber-200/45 blur-xl absolute" />
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#fef9c3] via-[#fde047] to-[#f59e0b] shadow-[0_0_40px_rgba(251,191,36,0.9)]" />
                    </div>
                </div>

                <div className="nube-1 absolute top-6 left-0 opacity-85">
                    <svg width="140" height="44" viewBox="0 0 150 48" fill="none">
                        <ellipse cx="48" cy="30" rx="34" ry="14" fill="white" fillOpacity="0.9" />
                        <ellipse cx="86" cy="24" rx="40" ry="18" fill="white" fillOpacity="0.95" />
                        <ellipse cx="118" cy="31" rx="26" ry="13" fill="white" fillOpacity="0.9" />
                    </svg>
                </div>

                <div className="nube-2 absolute top-14 left-0 opacity-65">
                    <svg width="110" height="36" viewBox="0 0 115 38" fill="none">
                        <ellipse cx="38" cy="23" rx="26" ry="11" fill="white" fillOpacity="0.85" />
                        <ellipse cx="68" cy="19" rx="30" ry="14" fill="white" fillOpacity="0.9" />
                        <ellipse cx="92" cy="24" rx="20" ry="10" fill="white" fillOpacity="0.85" />
                    </svg>
                </div>
            </div>

            {/* =========================================================
          ZONA SUPERIOR (LG): TECHO + DOBLE ENCHUFE + VENTANALES
      ========================================================= */}
            <div className="relative z-20 w-full flex justify-center px-6" style={{ marginBottom: '-2px' }}>
                <div className="relative w-full max-w-[1440px] flex items-end">
                    {/* Ancho exacto del restaurante en LG (82.5%) */}
                    <div className="relative" style={{ width: '82.5%' }}>
                        <svg
                            className="w-full h-[290px] block pointer-events-none overflow-visible"
                            viewBox="0 0 940 295"
                            preserveAspectRatio="none"
                            xmlns="http://w3.org"
                        >
                            <defs>
                                <pattern id="tejasTrapecio" width="24" height="16" patternUnits="userSpaceOnUse">
                                    <rect width="24" height="16" fill="#b91c1c" />
                                    <path d="M0 16 Q12 7 24 16" fill="none" stroke="#7f1d1d" strokeWidth="2.2" />
                                    <path d="M0 8 Q12 -1 24 8" fill="none" stroke="#ef4444" strokeWidth="1.4" opacity="0.75" />
                                    <line x1="12" y1="0" x2="12" y2="16" stroke="#7f1d1d" strokeWidth="1.2" />
                                </pattern>
                                <linearGradient id="luzOficinaGerente" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#fef3c7" />
                                    <stop offset="100%" stopColor="#fde68a" />
                                </linearGradient>
                                <linearGradient id="metalChimenea" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#475569" />
                                    <stop offset="50%" stopColor="#cbd5e1" />
                                    <stop offset="100%" stopColor="#334155" />
                                </linearGradient>
                                <clipPath id="clipPantallaGerente">
                                    <rect x="206" y="124" width="94" height="52" rx="2" />
                                </clipPath>
                            </defs>

                            {/* CHIMENEA SOBRE LA ALTURA DE LA COCINA */}
                            <g>
                                <circle className="humo-chim-1" cx="315" cy="-34" r="9" fill="#e2e8f0" />
                                <circle className="humo-chim-2" cx="322" cy="-38" r="12" fill="#cbd5e1" />
                                <circle className="humo-chim-3" cx="312" cy="-36" r="10" fill="#f1f5f9" />

                                <rect x="298" y="-26" width="34" height="36" rx="2" fill="url(#metalChimenea)" stroke="#1e293b" strokeWidth="1.8" />
                                <polygon points="290,-26 340,-26 332,-34 298,-34" fill="#1e293b" />
                                <line x1="302" y1="-26" x2="302" y2="-32" stroke="#64748b" strokeWidth="2" />
                                <line x1="328" y1="-26" x2="328" y2="-32" stroke="#64748b" strokeWidth="2" />
                            </g>

                            <polygon
                                points="96,13 844,13 936,288 4,288"
                                fill="url(#tejasTrapecio)"
                                stroke="#7f1d1d"
                                strokeWidth="3"
                            />
                            <line x1="96" y1="13" x2="4" y2="288" stroke="#facc15" strokeWidth="3.5" />
                            <line x1="844" y1="13" x2="936" y2="288" stroke="#facc15" strokeWidth="3.5" />

                            {/* VENTANAL IZQUIERDO: OFICINA DEL GERENTE */}
                            <rect
                                x="110"
                                y="32"
                                width="290"
                                height="244"
                                rx="14"
                                fill="url(#luzOficinaGerente)"
                                stroke="#facc15"
                                strokeWidth="3.5"
                            />
                            <rect x="124" y="40" width="118" height="19" rx="4" fill="#1e293b" />
                            <text x="183" y="53" fontSize="9.5" fontWeight="800" fill="#fef08a" textAnchor="middle" letterSpacing="0.8">
                                GERENCIA GENERAL
                            </text>

                            {/* Cuadro estadístico de Ventas */}
                            <rect x="288" y="44" width="94" height="50" rx="4" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
                            <text x="295" y="54" fontSize="6.5" fontWeight="800" fill="#1e293b" letterSpacing="0.6">
                                VENTAS
                            </text>
                            <polyline
                                points="298,84 318,71 338,76 360,59 374,63"
                                fill="none"
                                stroke="#dc2626"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <circle cx="360" cy="59" r="3" fill="#16a34a" />


                            <rect x="144" y="200" width="206" height="9" rx="2" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
                                          {/* =====================================================
                  ALCANCÍA HIPOPÓTAMO RETRO EN EL ESCRITORIO ("SAVES")
              ===================================================== */}
              <g transform="translate(152, 168)">
                {/* Patitas cortas apoyadas en el escritorio (Y=32 -> 168+32 = 200) */}
                <rect x="7" y="25" width="6" height="7" rx="2.5" fill="#15803d" stroke="#052e16" strokeWidth="1.1" />
                <rect x="19" y="25" width="6" height="7" rx="2.5" fill="#15803d" stroke="#052e16" strokeWidth="1.1" />

                {/* Cuerpo gordito verde */}
                <ellipse cx="16" cy="19" rx="13" ry="9.5" fill="#16a34a" stroke="#052e16" strokeWidth="1.2" />

                {/* Ranura superior de alcancía */}
                <rect x="11" y="10" width="8" height="2" rx="1" fill="#052e16" />

                {/* Parche lateral crema/naranja estilo retro con texto SAVES */}
                <ellipse cx="13" cy="19" rx="7.5" ry="6" fill="#fef3c7" stroke="#052e16" strokeWidth="0.9" />
                <ellipse cx="13" cy="19.5" rx="6.2" ry="4.5" fill="#ea580c" />
                <text
                  x="13"
                  y="20.8"
                  fontSize="3.4"
                  fontWeight="900"
                  fill="#fef3c7"
                  textAnchor="middle"
                  letterSpacing="0.2"
                >
                  SAVES
                </text>

                {/* Orejita redonda */}
                <circle cx="24" cy="7" r="2.6" fill="#16a34a" stroke="#052e16" strokeWidth="1.1" />

                {/* Cabeza y hocico abierto mirando a la derecha */}
                <ellipse cx="30" cy="11" rx="7.5" ry="6" fill="#16a34a" stroke="#052e16" strokeWidth="1.2" />
                {/* Hocico superior */}
                <ellipse cx="36" cy="9.5" rx="5.5" ry="3.5" fill="#16a34a" stroke="#052e16" strokeWidth="1.2" />
                {/* Fosa nasal */}
                <circle cx="37.5" cy="8.5" r="0.9" fill="#052e16" />

                {/* Boca abierta roja + mandíbula inferior */}
                <path
                  d="M28 13 Q35 19 40 14 Q36 12 28 13 Z"
                  fill="#dc2626"
                  stroke="#052e16"
                  strokeWidth="1"
                />
                {/* Dientitos blancos */}
                <rect x="33" y="12.2" width="2" height="2.2" rx="0.5" fill="#ffffff" />
                <rect x="37" y="12" width="2" height="2.2" rx="0.5" fill="#ffffff" />
                <rect x="35" y="15.2" width="2" height="2" rx="0.5" fill="#ffffff" />

                {/* Ojo expresivo */}
                <ellipse cx="28.5" cy="8.5" rx="2" ry="2.6" fill="#ffffff" stroke="#052e16" strokeWidth="0.9" />
                <circle cx="29" cy="8.5" r="1.1" fill="#052e16" />
              </g>

                            <rect x="158" y="209" width="14" height="65" fill="#451a03" />
                            <rect x="322" y="209" width="14" height="65" fill="#451a03" />

                            <rect x="200" y="118" width="106" height="64" rx="5" fill="#0f172a" stroke="#334155" strokeWidth="3" />
                            <rect x="246" y="182" width="14" height="18" fill="#475569" />
                            <rect x="230" y="196" width="46" height="4" rx="2" fill="#334155" />

                            <rect x="206" y="124" width="94" height="52" rx="2" fill="#090d16" />
                            <g clipPath="url(#clipPantallaGerente)">
                                <rect className="stat-bar-1" x="213" y="146" width="11" height="26" rx="1.5" fill="#22c55e" />
                                <rect className="stat-bar-2" x="229" y="138" width="11" height="34" rx="1.5" fill="#38bdf8" />
                                <rect className="stat-bar-3" x="245" y="142" width="11" height="30" rx="1.5" fill="#facc15" />
                                <rect className="stat-bar-4" x="261" y="133" width="11" height="39" rx="1.5" fill="#ef4444" />
                                <rect className="stat-bar-2" x="277" y="136" width="11" height="36" rx="1.5" fill="#a855f7" />
                                <polyline
                                    points="214,162 234,147 251,154 271,134 287,139"
                                    fill="none"
                                    stroke="#fde047"
                                    strokeWidth="2.4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <circle cx="271" cy="134" r="2.8" fill="#22c55e" />

                            </g>


                            {/* Gerente de espaldas con silla completa (base + pistón + cojín + conector + respaldo) */}
                            <g>
                                {/* Base y ruedas de la silla */}
                                <line x1="252" y1="244" x2="252" y2="271" stroke="#1e293b" strokeWidth="5.5" />
                                <line x1="230" y1="271" x2="274" y2="271" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
                                <circle cx="232" cy="273" r="3" fill="#0f172a" />
                                <circle cx="272" cy="273" r="3" fill="#0f172a" />

                                {/* Piernas y zapatos del gerente */}
                                <path d="M236 240 L232 269" stroke="#0f172a" strokeWidth="8" strokeLinecap="round" />
                                <path d="M268 240 L272 269" stroke="#0f172a" strokeWidth="8" strokeLinecap="round" />
                                <ellipse cx="230" cy="272" rx="7" ry="3.5" fill="#78350f" />
                                <ellipse cx="274" cy="272" rx="7" ry="3.5" fill="#78350f" />

                                {/* Cojín del asiento */}
                                <rect x="224" y="236" width="56" height="9" rx="4.5" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />

                                {/* Torso / saco del gerente */}
                                <path
                                    d="M228 178 C228 168, 276 168, 276 178 L280 236 H224 Z"
                                    fill="#1e3a8a"
                                    stroke="#172554"
                                    strokeWidth="1.5"
                                />
                                <line x1="252" y1="176" x2="252" y2="208" stroke="#172554" strokeWidth="1.5" />

                                {/* Columna que conecta el cojín con el respaldo */}
                                <rect x="247" y="226" width="10" height="12" rx="2" fill="#334155" stroke="#0f172a" strokeWidth="1.2" />

                                {/* Respaldo de la silla */}
                                <rect x="230" y="204" width="44" height="25" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />

                                {/* Cabeza y cuello */}
                                <rect x="246" y="162" width="12" height="10" rx="3" fill="#fed7aa" />
                                <circle cx="238" cy="153" r="3" fill="#fed7aa" />
                                <circle cx="266" cy="153" r="3" fill="#fed7aa" />
                                <circle cx="252" cy="152" r="14" fill="#451a03" />
                            </g>


                            {/* =====================================================
                  ENCHUFE A EN GERENCIA (X=384) -> CABLE -> ENCHUFE B EN SERVIDORES (X=514)
              ===================================================== */}
                            {/* Enchufe A (lado Gerencia) */}
                            <rect x="384" y="226" width="12" height="18" rx="2" fill="#f8fafc" stroke="#475569" strokeWidth="1.5" />
                            <circle cx="390" cy="232" r="1.5" fill="#0f172a" />
                            <circle cx="390" cy="238" r="1.5" fill="#0f172a" />

                            {/* Cable negro de recuadro a recuadro */}
                            <path
                                d="M396 235 C428 235, 438 258, 455 258 C472 258, 482 235, 514 235"
                                fill="none"
                                stroke="#0f172a"
                                strokeWidth="5"
                                strokeLinecap="round"
                            />

                            {conectadoServidor && (
                                <path
                                    className="cable-datos-activo"
                                    d="M396 235 C428 235, 438 258, 455 258 C472 258, 482 235, 514 235"
                                    fill="none"
                                    stroke="#4ade80"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                />
                            )}

                            {/* Enchufe B (lado Servidores, tocando el marco amarillo en X=514) */}
                            <rect x="514" y="226" width="12" height="18" rx="2" fill="#f8fafc" stroke="#475569" strokeWidth="1.5" />
                            <circle cx="520" cy="232" r="1.5" fill="#0f172a" />
                            <circle cx="520" cy="238" r="1.5" fill="#0f172a" />
                            {/* Capuchón del cable entrando al enchufe derecho */}
                            <rect x="506" y="230" width="8" height="10" rx="2" fill="#1e293b" />

                            {/* Cornisa / alero inferior apoyado directo sobre el restaurante */}
                            <rect x="0" y="285" width="940" height="10" rx="2" fill="#facc15" stroke="#92400e" strokeWidth="1.5" />
                        </svg>

                        {/* VENTANAL DERECHO (LG: right 11.2% + width 33% -> borde izquierdo exacto en X=524 tocando el enchufe) */}
                        <div
                            style={{
                                position: 'absolute',
                                right: '11.2%',
                                bottom: '16px',
                                width: '33%',
                                height: '244px',
                                borderRadius: '14px',
                                border: '3.5px solid #facc15',
                                backgroundColor: '#050811',
                                overflow: 'hidden',
                                boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
                                zIndex: 30,
                            }}
                        >
                            <svg
                                className="w-full h-full block"
                                viewBox="0 0 300 244"
                                preserveAspectRatio="none"
                                xmlns="http://w3.org"
                            >
                                <defs>
                                    <linearGradient id="metalTorreServidor" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#64748b" />
                                        <stop offset="50%" stopColor="#94a3b8" />
                                        <stop offset="100%" stopColor="#475569" />
                                    </linearGradient>
                                </defs>

                                <text x="150" y="19" fontSize="8" fontWeight="800" fill="#4ade80" textAnchor="middle" letterSpacing="1.3" opacity="0.9">
                                    DATA CENTER • TORRES CENTRALES
                                </text>

                                {/* 3 TORRES VERTICALES METÁLICAS CLARAS */}
                                {[18, 113, 208].map((xPos, idx) => (
                                    <g key={`tower-${idx}`}>
                                        <rect
                                            x={xPos}
                                            y="28"
                                            width="74"
                                            height="204"
                                            rx="5"
                                            fill="url(#metalTorreServidor)"
                                            stroke="#cbd5e1"
                                            strokeWidth="1.6"
                                        />
                                        <rect x={xPos + 8} y="36" width="58" height="36" rx="3" fill="#0f172a" stroke="#e2e8f0" strokeWidth="1" />
                                        <circle className="led-srv-1" cx={xPos + 18} cy="48" r="2.8" />
                                        <circle className="led-srv-2" cx={xPos + 29} cy="48" r="2.8" />
                                        <circle className="led-srv-3" cx={xPos + 40} cy="48" r="2.8" />
                                        <circle className="led-srv-4" cx={xPos + 18} cy="60" r="2.4" />
                                        <line x1={xPos + 28} y1="60" x2={xPos + 58} y2="60" stroke="#22c55e" strokeWidth="2" />

                                        <rect x={xPos + 10} y="82" width="14" height="72" rx="2" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1" />
                                        <rect x={xPos + 30} y="82" width="14" height="72" rx="2" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1" />
                                        <rect x={xPos + 50} y="82" width="14" height="72" rx="2" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1" />

                                        <circle className="led-srv-2" cx={xPos + 17} cy="92" r="2" />
                                        <circle className="led-srv-4" cx={xPos + 37} cy="92" r="2" />
                                        <circle className="led-srv-1" cx={xPos + 57} cy="92" r="2" />

                                        <line x1={xPos + 16} y1="166" x2={xPos + 16} y2="220" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
                                        <line x1={xPos + 26} y1="166" x2={xPos + 26} y2="220" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
                                        <line x1={xPos + 37} y1="166" x2={xPos + 37} y2="220" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
                                        <line x1={xPos + 48} y1="166" x2={xPos + 48} y2="220" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
                                        <line x1={xPos + 58} y1="166" x2={xPos + 58} y2="220" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
                                    </g>
                                ))}
                            </svg>

                            {!conectadoServidor ? (
                                <div
                                    className="absolute inset-0 flex flex-col items-center justify-center p-4"
                                    style={{ backgroundColor: 'rgba(3, 7, 18, 0.32)' }}
                                >
                                    <div className="flex items-center gap-1.5 mb-2 px-2.5 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/40">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                        <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-300">
                                            Torres en línea
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setConectadoServidor(true)}
                                        style={{
                                            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                                            boxShadow: '0 0 24px rgba(34, 197, 94, 0.65)',
                                        }}
                                        className="px-6 py-2.5 rounded-xl text-white font-black text-sm tracking-wider uppercase border border-emerald-300/60 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                    >
                                        Conectar
                                    </button>
                                </div>
                            ) : (
                                <div className="server-form-glass absolute inset-0 flex flex-col justify-center px-5 py-2.5 transition-all">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setConectadoServidor(false)
                                            setError('')
                                        }}
                                        title="Desconectar"
                                        className="absolute top-2 right-3 text-[10px] font-bold uppercase tracking-wider text-emerald-300 hover:text-white cursor-pointer"
                                    >
                                        ✕ Cerrar
                                    </button>

                                    <div className="text-center mb-1.5">
                                        <span className="inline-block text-[9.5px] font-extrabold tracking-widest uppercase text-emerald-400">
                                            ● Enlace establecido
                                        </span>
                                        <h1 className="text-lg font-black tracking-tight text-white drop-shadow">
                                            Administración
                                        </h1>
                                    </div>

                                    <form className="flex flex-col gap-1.5" onSubmit={handleSubmit}>
                                        {error && (
                                            <div className="bg-red-600/95 text-white px-2 py-1 rounded-lg text-[10.5px] font-semibold text-center">
                                                {error}
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-0.5">
                                            <label htmlFor="email" className="text-[11px] font-bold text-white drop-shadow">
                                                Correo electrónico
                                            </label>
                                            <input
                                                id="email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => {
                                                    setEmail(e.target.value)
                                                    setError('')
                                                }}
                                                placeholder="admin@burgerfast.com"
                                                required
                                                style={{ backgroundColor: 'rgba(15, 23, 42, 0.72)' }}
                                                className="w-full text-white placeholder:text-slate-300 text-xs font-medium rounded-xl px-3 py-1.5 border border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                                            />
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <label htmlFor="password" className="text-[11px] font-bold text-white drop-shadow">
                                                Contraseña
                                            </label>
                                            <div className="relative flex items-center">
                                                <input
                                                    id="password"
                                                    type={mostrarPassword ? 'text' : 'password'}
                                                    value={password}
                                                    onChange={(e) => {
                                                        setPassword(e.target.value)
                                                        setError('')
                                                    }}
                                                    placeholder="••••••••"
                                                    required
                                                    style={{ backgroundColor: 'rgba(15, 23, 42, 0.72)' }}
                                                    className="w-full text-white placeholder:text-slate-300 text-xs font-medium rounded-xl pl-3 pr-8 py-1.5 border border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setMostrarPassword(!mostrarPassword)}
                                                    className="absolute right-2.5 text-slate-300 hover:text-emerald-300 cursor-pointer"
                                                    tabIndex={-1}
                                                >
                                                    {mostrarPassword ? (
                                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                                            <line x1="1" y1="1" x2="23" y2="23" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                                            <circle cx="12" cy="12" r="3" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={cargando}
                                            style={{ background: 'linear-gradient(to right, #dc2626, #b91c1c)' }}
                                            className="mt-1 w-full text-white font-bold text-xs py-1.5 rounded-xl shadow-lg shadow-red-600/40 active:scale-[0.99] transition-all cursor-pointer"
                                        >
                                            {cargando ? 'Ingresando...' : 'Iniciar sesión'}
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* =========================================================
          ESCENA INFERIOR (LG): LOCAL + MANITOS EN PERSONAJES + TÓTEM + DELIVERY
      ========================================================= */}
            <div className="relative z-10 w-full pointer-events-none shrink-0">
                <div className="max-w-[1440px] mx-auto px-6">
                    <svg
                        className="w-full h-[270px] block overflow-visible"
                        viewBox="0 0 1140 215"
                        preserveAspectRatio="none"
                        xmlns="http://w3.org"
                    >
                        <defs>
                            <pattern id="pisoEscaqueado" width="20" height="14" patternUnits="userSpaceOnUse">
                                <rect x="0" y="0" width="10" height="7" fill="#f8fafc" />
                                <rect x="10" y="0" width="10" height="7" fill="#0f172a" />
                                <rect x="0" y="7" width="10" height="7" fill="#0f172a" />
                                <rect x="10" y="7" width="10" height="7" fill="#f8fafc" />
                            </pattern>

                            <linearGradient id="paredDeposito" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#cbd5e1" />
                                <stop offset="100%" stopColor="#94a3b8" />
                            </linearGradient>

                            <linearGradient id="paredCocina" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#1e3a5f" />
                                <stop offset="100%" stopColor="#334155" />
                            </linearGradient>

                            <linearGradient id="paredSalonContraste" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#431407" />
                                <stop offset="45%" stopColor="#7c2d12" />
                                <stop offset="100%" stopColor="#9a3412" />
                            </linearGradient>

                            <linearGradient id="aceroInox" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#94a3b8" />
                                <stop offset="50%" stopColor="#f1f5f9" />
                                <stop offset="100%" stopColor="#64748b" />
                            </linearGradient>

                            <linearGradient id="hazLampara" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#fef08a" stopOpacity="0.92" />
                                <stop offset="65%" stopColor="#fde047" stopOpacity="0.35" />
                                <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
                            </linearGradient>

                            <linearGradient id="cartelOscuro" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#1e1b4b" />
                                <stop offset="100%" stopColor="#090d16" />
                            </linearGradient>
                        </defs>

                        {/* MARCO EXTERIOR DEL LOCAL */}
                        <rect x="2" y="0" width="936" height="215" fill="#ffffff" stroke="#1e293b" strokeWidth="3.5" />

                        {/* 1. DEPÓSITO */}
                        <rect x="4" y="2" width="186" height="197" fill="url(#paredDeposito)" />
                        <rect x="4" y="199" width="186" height="14" fill="url(#pisoEscaqueado)" stroke="#334155" strokeWidth="1" />

                        <rect x="0" y="76" width="6" height="123" fill="#334155" />
                        <rect x="6" y="76" width="30" height="123" fill="#cbd5e1" stroke="#64748b" strokeWidth="1.5" />
                        <circle cx="31" cy="140" r="2.5" fill="#334155" />

                        <rect x="48" y="14" width="66" height="16" rx="3" fill="#1e293b" />
                        <text x="81" y="25" fontSize="8.5" fontWeight="800" fill="#f8fafc" textAnchor="middle" letterSpacing="1">
                            DEPÓSITO
                        </text>

                        <g>
                            <rect x="124" y="40" width="62" height="159" fill="none" stroke="#334155" strokeWidth="2.5" />
                            <line x1="124" y1="80" x2="186" y2="80" stroke="#334155" strokeWidth="2.5" />
                            <line x1="124" y1="120" x2="186" y2="120" stroke="#334155" strokeWidth="2.5" />
                            <line x1="124" y1="160" x2="186" y2="160" stroke="#334155" strokeWidth="2.5" />

                            <rect x="129" y="56" width="24" height="22" rx="2" fill="#d97706" stroke="#78350f" strokeWidth="1.2" />
                            <line x1="129" y1="65" x2="153" y2="65" stroke="#fef3c7" strokeWidth="2" />
                            <rect x="157" y="60" width="24" height="18" rx="2" fill="#b45309" stroke="#78350f" strokeWidth="1.2" />

                            <rect x="130" y="96" width="26" height="22" rx="2" fill="#ea580c" stroke="#7c2d12" strokeWidth="1.2" />
                            <rect x="134" y="101" width="8" height="5" fill="#ffffff" opacity="0.85" />
                            <rect x="160" y="98" width="21" height="20" rx="2" fill="#d97706" stroke="#78350f" strokeWidth="1.2" />

                            <rect x="129" y="136" width="25" height="22" rx="2" fill="#f59e0b" stroke="#78350f" strokeWidth="1.2" />
                            <rect x="157" y="134" width="24" height="24" rx="2" fill="#b45309" stroke="#78350f" strokeWidth="1.2" />
                        </g>

                        {/* Empleado depósito */}
                        <g className="empleado-deposito-move">
                            <path d="M46 160 L44 201" stroke="#1e293b" strokeWidth="6.5" strokeLinecap="round" />
                            <path d="M54 160 L58 201" stroke="#334155" strokeWidth="6.5" strokeLinecap="round" />
                            <path d="M40 206 H53 C53 201, 48 199, 41 201 Z" fill="#78350f" stroke="#451a03" strokeWidth="0.8" />
                            <path d="M54 206 H68 C68 201, 63 199, 55 201 Z" fill="#78350f" stroke="#451a03" strokeWidth="0.8" />

                            <path d="M41 122 C41 117, 59 117, 59 122 L61 161 H39 Z" fill="#dc2626" />
                            <rect x="47" y="112" width="6" height="7" rx="2" fill="#fed7aa" />
                            <circle cx="50" cy="105" r="8.5" fill="#fed7aa" />
                            <circle cx="56" cy="104" r="1.3" fill="#1e293b" />
                            <path d="M41 103 C41 95, 59 95, 59 103 H64 V105.5 H41 Z" fill="#991b1b" />
                            <path d="M48 126 L54 138 L66 138" stroke="#b91c1c" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            <circle cx="67" cy="138" r="3.2" fill="#fed7aa" />
                            <rect x="62" y="118" width="26" height="22" rx="2" fill="#f59e0b" stroke="#78350f" strokeWidth="1.5" />
                            <line x1="62" y1="127" x2="88" y2="127" stroke="#fef3c7" strokeWidth="2" />
                        </g>

                        <rect x="190" y="2" width="9" height="211" fill="#64748b" stroke="#334155" strokeWidth="1.5" />

                        {/* 2. COCINA CONTRASTANTE */}
                        <rect x="199" y="2" width="275" height="197" fill="url(#paredCocina)" />
                        <rect x="199" y="199" width="275" height="14" fill="url(#pisoEscaqueado)" stroke="#334155" strokeWidth="1" />

                        <path d="M276 2 H436 L448 34 H264 Z" fill="url(#aceroInox)" stroke="#475569" strokeWidth="2" />
                        <rect x="262" y="34" width="188" height="6" fill="#0f172a" />

                        <rect x="208" y="14" width="54" height="16" rx="3" fill="#f59e0b" />
                        <text x="235" y="25" fontSize="8.5" fontWeight="900" fill="#0f172a" textAnchor="middle" letterSpacing="0.8">
                            COCINA
                        </text>

                        {/* Plancha de hamburguesas */}
                        <rect x="262" y="136" width="84" height="63" rx="2" fill="url(#aceroInox)" stroke="#334155" strokeWidth="2" />
                        <rect x="259" y="130" width="90" height="7" rx="1" fill="#0f172a" />
                        <ellipse cx="280" cy="128" rx="10" ry="3.2" fill="#451a03" />
                        <path d="M273 126 H287 L285 129 H275 Z" fill="#facc15" />
                        <ellipse cx="305" cy="128" rx="10" ry="3.2" fill="#451a03" />
                        <ellipse cx="329" cy="128" rx="10" ry="3.2" fill="#451a03" />
                        <path d="M322 126 H336 L334 129 H324 Z" fill="#facc15" />

                        {/* Vapor en la cocina */}
                        <path className="vapor-1" d="M280 118 Q274 106 282 92" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                        <path className="vapor-2" d="M306 118 Q313 104 304 90" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                        <path className="vapor-3" d="M330 118 Q324 106 331 92" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" fill="none" />

                        {/* Chef 1 */}
                        <g>
                            <path d="M241 160 L239 201" stroke="#0f172a" strokeWidth="6.5" strokeLinecap="round" />
                            <path d="M249 160 L252 201" stroke="#1e293b" strokeWidth="6.5" strokeLinecap="round" />
                            <path d="M235 206 H247 C247 201, 242 199, 236 201 Z" fill="#78350f" stroke="#451a03" strokeWidth="0.8" />
                            <path d="M248 206 H261 C261 201, 256 199, 249 201 Z" fill="#78350f" stroke="#451a03" strokeWidth="0.8" />

                            <path d="M236 122 C236 117, 255 117, 255 122 L257 161 H235 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
                            <rect x="243" y="112" width="6" height="7" rx="2" fill="#fed7aa" />
                            <circle cx="246" cy="105" r="8.5" fill="#fed7aa" />
                            <circle cx="252" cy="104" r="1.3" fill="#1e293b" />
                            <path d="M237 99 C235 88, 257 88, 255 99 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
                            <g className="cocinero-brazo">
                                <path d="M245 126 L266 125" stroke="#cbd5e1" strokeWidth="5.5" strokeLinecap="round" />
                                <circle cx="267" cy="125" r="3.2" fill="#fed7aa" />
                                <line x1="268" y1="125" x2="283" y2="123" stroke="#f8fafc" strokeWidth="2.5" strokeLinecap="round" />
                            </g>
                        </g>

                        {/* Freidora */}
                        <rect x="384" y="134" width="62" height="65" rx="2" fill="url(#aceroInox)" stroke="#0f172a" strokeWidth="2" />
                        <rect x="388" y="129" width="54" height="6" fill="#0f172a" />

                        {/* Chef 2 con papas fritas contrastantes */}
                        <g>
                            <path d="M358 160 L356 201" stroke="#0f172a" strokeWidth="6.5" strokeLinecap="round" />
                            <path d="M366 160 L369 201" stroke="#1e293b" strokeWidth="6.5" strokeLinecap="round" />
                            <path d="M352 206 H364 C364 201, 359 199, 353 201 Z" fill="#78350f" stroke="#451a03" strokeWidth="0.8" />
                            <path d="M365 206 H378 C378 201, 373 199, 366 201 Z" fill="#78350f" stroke="#451a03" strokeWidth="0.8" />

                            <path d="M353 122 C353 117, 371 117, 371 122 L373 161 H351 Z" fill="#dc2626" />
                            <rect x="359" y="112" width="6" height="7" rx="2" fill="#fed7aa" />
                            <circle cx="362" cy="105" r="8.5" fill="#fed7aa" />
                            <circle cx="368" cy="104" r="1.3" fill="#1e293b" />
                            <path d="M353 103 C353 96, 371 96, 371 103 H375 V105.5 H353 Z" fill="#991b1b" />
                            <g className="freidora-brazo">
                                <path d="M362 126 L384 119" stroke="#b91c1c" strokeWidth="5.5" strokeLinecap="round" />
                                <circle cx="385" cy="119" r="3.2" fill="#fed7aa" />
                                <line x1="391" y1="103" x2="394" y2="114" stroke="#fde047" strokeWidth="3" strokeLinecap="round" />
                                <line x1="396" y1="101" x2="397" y2="114" stroke="#facc15" strokeWidth="3" strokeLinecap="round" />
                                <line x1="401" y1="102" x2="400" y2="114" stroke="#fef08a" strokeWidth="3" strokeLinecap="round" />
                                <line x1="406" y1="103" x2="404" y2="114" stroke="#facc15" strokeWidth="3" strokeLinecap="round" />
                                <rect x="387" y="111" width="24" height="15" rx="2" fill="#cbd5e1" stroke="#0f172a" strokeWidth="1.5" />
                                <line x1="392" y1="111" x2="392" y2="126" stroke="#475569" strokeWidth="1" />
                                <line x1="399" y1="111" x2="399" y2="126" stroke="#475569" strokeWidth="1" />
                                <line x1="406" y1="111" x2="406" y2="126" stroke="#475569" strokeWidth="1" />
                            </g>
                        </g>

                        {/* Muro Cocina / Mostrador */}
                        <rect x="474" y="2" width="9" height="80" fill="#64748b" stroke="#334155" strokeWidth="1.5" />
                        <rect x="474" y="136" width="9" height="77" fill="#64748b" stroke="#334155" strokeWidth="1.5" />

                        {/* =====================================================
                3. MOSTRADOR & SALÓN
            ===================================================== */}
                        <rect x="483" y="2" width="453" height="197" fill="url(#paredSalonContraste)" />
                        <rect x="483" y="199" width="453" height="14" fill="url(#pisoEscaqueado)" stroke="#334155" strokeWidth="1" />

                        <g opacity="0.94">
                            <text x="764" y="38" fontSize="13" fontWeight="300" fontStyle="italic" fill="#fde68a" textAnchor="middle" letterSpacing="1.5">
                                "La nueva forma"
                            </text>
                            <text x="764" y="55" fontSize="15" fontWeight="900" fill="#facc15" textAnchor="middle" letterSpacing="2.5">
                                DE COMER  
                            </text>
                            <line x1="704" y1="61" x2="824" y2="61" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
                        </g>

                        <rect x="498" y="14" width="128" height="16" rx="3" fill="#dc2626" />
                        <text x="562" y="25" fontSize="8.5" fontWeight="800" fill="#ffffff" textAnchor="middle" letterSpacing="0.8">
                            MOSTRADOR & SALÓN
                        </text>

                        {/* Lámparas colgantes */}
                        <g>
                            <line x1="664" y1="2" x2="664" y2="34" stroke="#94a3b8" strokeWidth="2" />
                            <path d="M652 42 C652 33, 676 33, 676 42 Z" fill="#ef4444" stroke="#facc15" strokeWidth="1" />
                            <ellipse cx="664" cy="42" rx="9" ry="3" fill="#fef9c3" />
                            <polygon className="luz-lampara-salon" points="652,42 676,42 712,199 616,199" fill="url(#hazLampara)" />

                            <line x1="854" y1="2" x2="854" y2="34" stroke="#94a3b8" strokeWidth="2" />
                            <path d="M842 42 C842 33, 866 33, 866 42 Z" fill="#ef4444" stroke="#facc15" strokeWidth="1" />
                            <ellipse cx="854" cy="42" rx="9" ry="3" fill="#fef9c3" />
                            <polygon className="luz-lampara-salon" points="842,42 866,42 902,199 806,199" fill="url(#hazLampara)" />
                        </g>

                        {/* Menú digital */}
                        <rect x="500" y="38" width="84" height="36" rx="3" fill="#090d16" stroke="#facc15" strokeWidth="2" />
                        <rect x="506" y="44" width="21" height="11" rx="1.5" fill="#ef4444" />
                        <rect x="531" y="44" width="21" height="11" rx="1.5" fill="#facc15" />
                        <rect x="556" y="44" width="21" height="11" rx="1.5" fill="#22c55e" />
                        <line x1="506" y1="63" x2="576" y2="63" stroke="#64748b" strokeWidth="2" />

                        {/* Cajero */}
                        <g>
                            <path d="M514 120 C514 115, 532 115, 532 120 L534 150 H512 Z" fill="#dc2626" />
                            <rect x="520" y="110" width="6" height="7" rx="2" fill="#fed7aa" />
                            <circle cx="523" cy="103" r="8.5" fill="#fed7aa" />
                            <circle cx="529" cy="102" r="1.3" fill="#1e293b" />
                            <path d="M514 101 C514 94, 532 94, 532 101 H536 V103.5 H514 Z" fill="#0f172a" />
                        </g>

                        {/* Mostrador con POS */}
                        <rect x="502" y="142" width="72" height="57" rx="2" fill="#dc2626" stroke="#450a0a" strokeWidth="2" />
                        <rect x="498" y="137" width="80" height="6" rx="1" fill="#facc15" />
                        <polygon points="546,137 559,137 563,122 550,122" fill="#0f172a" />

                        {/* Cliente comprando (Con manito agregada) */}
                        <g>
                            <path d="M590 160 L588 201" stroke="#38bdf8" strokeWidth="6.5" strokeLinecap="round" />
                            <path d="M598 160 L602 201" stroke="#0284c7" strokeWidth="6.5" strokeLinecap="round" />
                            <path d="M578 206 H591 C591 201, 586 199, 579 201 Z" fill="#b45309" stroke="#451a03" strokeWidth="0.8" />
                            <path d="M592 206 H605 C605 201, 600 199, 593 201 Z" fill="#b45309" stroke="#451a03" strokeWidth="0.8" />

                            <path d="M586 122 C586 117, 605 117, 605 122 L607 161 H585 Z" fill="#38bdf8" />
                            <rect x="593" y="112" width="6" height="7" rx="2" fill="#fdba74" />
                            <circle cx="596" cy="105" r="8.5" fill="#fdba74" />
                            <circle cx="590" cy="104" r="1.3" fill="#1e293b" />
                            <path d="M588 103 C588 95, 605 95, 605 103 Z" fill="#1e1b4b" />
                            <path d="M591 128 L571 127" stroke="#0284c7" strokeWidth="5.5" strokeLinecap="round" />
                            <circle cx="569" cy="127" r="3.2" fill="#fdba74" />
                        </g>

                        {/* Salón Mesa 1 (Con manitos en ambos comensales) */}
                        <g>
                            <path d="M636 152 V203 M636 171 H653 V203" stroke="#94a3b8" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                            <path d="M648 164 H664 L667 201" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" fill="none" />
                            <path d="M664 206 H677 C677 201, 672 199, 665 201 Z" fill="#78350f" stroke="#451a03" strokeWidth="0.8" />

                            <path d="M641 128 C641 123, 658 123, 658 128 L660 165 H640 Z" fill="#22c55e" />
                            <circle cx="650" cy="114" r="8.5" fill="#fed7aa" />
                            <circle cx="656" cy="113" r="1.3" fill="#1e293b" />
                            <g className="cliente-brazo-comer">
                                <path d="M650 132 L667 124" stroke="#16a34a" strokeWidth="5" strokeLinecap="round" />
                                <circle cx="668" cy="123" r="3.2" fill="#fed7aa" />
                                <circle cx="672" cy="121" r="4.8" fill="#f59e0b" />
                            </g>

                            <rect x="666" y="156" width="52" height="5.5" rx="2" fill="#facc15" stroke="#b45309" strokeWidth="1.2" />
                            <line x1="692" y1="161.5" x2="692" y2="203" stroke="#cbd5e1" strokeWidth="4.5" />
                            <line x1="678" y1="203" x2="706" y2="203" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
                            <rect x="676" y="152.5" width="18" height="3.5" fill="#ef4444" />
                            <rect x="699" y="144" width="7" height="12" rx="1" fill="#38bdf8" />
                            <line x1="703" y1="144" x2="705" y2="139" stroke="#ffffff" strokeWidth="1.5" />

                            <path d="M748 152 V203 M748 171 H731 V203" stroke="#94a3b8" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                            <path d="M736 164 H720 L717 201" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" fill="none" />
                            <path d="M708 206 H720 C720 201, 715 199, 709 201 Z" fill="#991b1b" stroke="#450a0a" strokeWidth="0.8" />

                            <path d="M726 128 C726 123, 743 123, 743 128 L744 165 H724 Z" fill="#c084fc" />
                            <circle cx="734" cy="114" r="8.5" fill="#fdba74" />
                            <circle cx="728" cy="113" r="1.3" fill="#1e293b" />
                            <g className="cliente-brazo-beber">
                                <path d="M732 132 L716 126" stroke="#a855f7" strokeWidth="5" strokeLinecap="round" />
                                <circle cx="715" cy="126" r="3.2" fill="#fdba74" />
                            </g>
                        </g>

                        {/* Salón Mesa 2 (Con brazo y manito agregada) */}
                        <g>
                            <path d="M792 152 V203 M792 171 H809 V203" stroke="#94a3b8" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                            <path d="M804 164 H820 L823 201" stroke="#334155" strokeWidth="6" strokeLinecap="round" fill="none" />
                            <path d="M820 206 H833 C833 201, 828 199, 821 201 Z" fill="#78350f" stroke="#451a03" strokeWidth="0.8" />

                            <path d="M797 128 C797 123, 814 123, 814 128 L816 165 H796 Z" fill="#fb923c" />
                            <circle cx="806" cy="114" r="8.5" fill="#fed7aa" />
                            <circle cx="812" cy="113" r="1.3" fill="#1e293b" />
                            <path d="M806 133 L824 148" stroke="#ea580c" strokeWidth="5" strokeLinecap="round" />
                            <circle cx="826" cy="149" r="3.2" fill="#fed7aa" />

                            <rect x="822" y="156" width="48" height="5.5" rx="2" fill="#facc15" stroke="#b45309" strokeWidth="1.2" />
                            <line x1="846" y1="161.5" x2="846" y2="203" stroke="#cbd5e1" strokeWidth="4.5" />
                            <line x1="832" y1="203" x2="860" y2="203" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
                            <rect x="834" y="152.5" width="18" height="3.5" fill="#ef4444" />

                            <path d="M898 152 V203 M898 171 H881 V203" stroke="#94a3b8" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                        </g>

                        {/* Ventanal panorámico derecho */}
                        <rect x="930" y="34" width="7" height="179" fill="#38bdf8" opacity="0.7" />

                        {/* =====================================================
                B. TÓTEM ALINEADO A LA ALTURA MÁXIMA DEL TECHO
            ===================================================== */}
                        <g>
                            <rect x="1008" y="203" width="62" height="12" rx="2" fill="#475569" stroke="#1e293b" strokeWidth="1.5" />

                            <rect x="1026" y="-148" width="26" height="351" fill="url(#aceroInox)" stroke="#475569" strokeWidth="1.5" />
                            <rect x="1036" y="-124" width="6" height="38" rx="3" fill="#dc2626" />
                            <rect x="1036" y="-66" width="6" height="38" rx="3" fill="#facc15" />
                            <rect x="1036" y="-8" width="6" height="38" rx="3" fill="#dc2626" />
                            <rect x="1036" y="50" width="6" height="38" rx="3" fill="#facc15" />
                            <rect x="1036" y="108" width="6" height="38" rx="3" fill="#dc2626" />

                            {/* Cuello de soporte */}
                            <rect x="1015" y="-160" width="48" height="12" rx="2" fill="#dc2626" stroke="#7f1d1d" strokeWidth="1.5" />

                            {/* Caja principal del cartel luminoso alineada a la altura máxima del techo */}
                            <rect
                                x="948"
                                y="-280"
                                width="182"
                                height="120"
                                rx="18"
                                fill="url(#cartelOscuro)"
                                stroke="#facc15"
                                strokeWidth="4.5"
                            />

                            {/* Logo de Burger Fast ocupando todo el cartel */}
                            <image
                                href={LOGO_EMPRESA_URL}
                                x="952"
                                y="-276"
                                width="174"
                                height="112"
                                preserveAspectRatio="xMidYMid slice"
                            />

                            {/* Cartel "ABIERTO 24 HORAS" con luces amarillas perimetrales */}
                            <g className="cartel-abierto-glow">
                                <line x1="1062" y1="-160" x2="1062" y2="-148" stroke="#facc15" strokeWidth="3" />
                                <line x1="1116" y1="-160" x2="1116" y2="-148" stroke="#facc15" strokeWidth="3" />

                                <rect
                                    x="1030"
                                    y="-150"
                                    width="118"
                                    height="30"
                                    rx="6"
                                    fill="#dc2626"
                                    stroke="#7f1d1d"
                                    strokeWidth="2.5"
                                />
                                <rect
                                    className="marquesina-perimetro-luces"
                                    x="1030"
                                    y="-150"
                                    width="118"
                                    height="30"
                                    rx="6"
                                    fill="none"
                                    stroke="#fef08a"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                />
                                <text
                                    x="1089"
                                    y="-131.5"
                                    fontSize="9.5"
                                    fontWeight="900"
                                    fill="#ffffff"
                                    textAnchor="middle"
                                    letterSpacing="0.7"
                                >
                                    ABIERTO 24 HORAS
                                </text>
                            </g>
                        </g>

                        {/* =====================================================
                C. MOTO Y DELIVERY CON MANITO EN EL MANUBRIO
            ===================================================== */}
                        {/* =====================================================
                C. MOTO HÍBRIDA DE REPARTO (Chasis robusto + estética Burger Fast)
            ===================================================== */}
                        <g className="moto-delivery-ruta">
                            {/* Caño de escape trasero */}
                            <path
                                d="M18 67 L4 63"
                                stroke="#94a3b8"
                                strokeWidth="4.5"
                                strokeLinecap="round"
                            />
                            <circle cx="4" cy="63" r="2.2" fill="#334155" />

                            {/* Rueda trasera gruesa */}
                            <circle cx="15" cy="75" r="12" fill="#0f172a" stroke="#334155" strokeWidth="2.5" />
                            <circle cx="15" cy="75" r="5.5" fill="#cbd5e1" />
                            <circle cx="15" cy="75" r="2.2" fill="#475569" />

                            {/* Rueda delantera gruesa */}
                            <circle cx="63" cy="75" r="12" fill="#0f172a" stroke="#334155" strokeWidth="2.5" />
                            <circle cx="63" cy="75" r="5.5" fill="#cbd5e1" />
                            <circle cx="63" cy="75" r="2.2" fill="#475569" />

                            {/* Basculante trasero y bloque de motor */}
                            <path
                                d="M15 75 L34 68 H45"
                                stroke="#475569"
                                strokeWidth="4.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                            />
                            <rect
                                x="30"
                                y="57"
                                width="17"
                                height="13"
                                rx="3"
                                fill="#64748b"
                                stroke="#1e293b"
                                strokeWidth="1.5"
                            />
                            <line x1="33" y1="61" x2="44" y2="61" stroke="#cbd5e1" strokeWidth="1.5" />
                            <line x1="33" y1="65" x2="44" y2="65" stroke="#cbd5e1" strokeWidth="1.5" />

                            {/* Horquilla delantera telescópica */}
                            <path
                                d="M49 38 L63 75"
                                stroke="#94a3b8"
                                strokeWidth="4.5"
                                strokeLinecap="round"
                            />
                            <path
                                d="M49 38 L55 54"
                                stroke="#dc2626"
                                strokeWidth="5.5"
                                strokeLinecap="round"
                            />

                            {/* Guardabarros delantero */}
                            <path
                                d="M54 61 Q63 56 71 62"
                                stroke="#dc2626"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                fill="none"
                            />

                            {/* Tanque de combustible y carenado */}
                            <path
                                d="M23 55 L38 46 H50 L53 55 L44 59 H26 Z"
                                fill="#dc2626"
                                stroke="#7f1d1d"
                                strokeWidth="1.5"
                                strokeLinejoin="round"
                            />
                            <line x1="37" y1="51" x2="49" y2="51" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" />

                            {/* Asiento negro */}
                            <path
                                d="M22 53 Q31 51 39 54"
                                stroke="#0f172a"
                                strokeWidth="5"
                                strokeLinecap="round"
                                fill="none"
                            />

                            {/* Manubrio y faro delantero */}
                            <path
                                d="M48 39 L53 35 L59 35"
                                stroke="#1e293b"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                fill="none"
                            />
                            <circle cx="57" cy="43" r="4" fill="#fef08a" stroke="#f59e0b" strokeWidth="1" />

                            {/* Caja térmica trasera Burger Fast */}
                            <rect x="1" y="33" width="24" height="22" rx="3" fill="#dc2626" stroke="#facc15" strokeWidth="1.8" />
                            <rect x="4" y="41" width="18" height="5" rx="1" fill="#facc15" />

                            {/* Repartidor montado con pierna flexionada y pedalín */}
                            <path
                                d="M34 52 L44 61 L39 71"
                                stroke="#1e293b"
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                            />
                            <line x1="35" y1="73" x2="43" y2="73" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M36 72 H47 C47 68, 43 67, 37 68 Z" fill="#78350f" stroke="#451a03" strokeWidth="0.6" />
                            <path d="M29 28 C29 23, 43 23, 43 28 L44 53 H28 Z" fill="#ef4444" />
                            <path d="M37 32 L52 36" stroke="#b91c1c" strokeWidth="5" strokeLinecap="round" />
                            <circle cx="53" cy="36" r="3" fill="#fed7aa" />
                            <circle cx="37" cy="15" r="9.5" fill="#dc2626" stroke="#facc15" strokeWidth="1.5" />
                            <path d="M39 11 H46 C47 14, 46 18, 40 18 Z" fill="#0f172a" />


                        </g>

                    </svg>
                </div>

                {/* =======================================================
            D. VEREDA Y CALLE LIMPIA EN LA BASE
        ======================================================= */}
                <div className="w-full relative z-20">
                    <div className="w-full h-2.5 bg-slate-300 border-t border-slate-400" />
                    <div className="w-full h-8 bg-[#1e293b] border-t-2 border-slate-500 flex items-center">
                        <div
                            className="w-full h-[2.5px] opacity-75"
                            style={{
                                backgroundImage:
                                    'repeating-linear-gradient(to right, #facc15 0px, #facc15 44px, transparent 44px, transparent 88px)',
                            }}
                        />
                    </div>
                </div>
            </div>
        </main>
    )
}
