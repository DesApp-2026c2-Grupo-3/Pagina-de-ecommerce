import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import type { AdministradorSesion } from '../types/sesion.types'
import { iniciarSesion as iniciarSesionApi } from '../services/authService'
import { useAuth } from '../context/AuthContext'

// Logo BurgerFast vectorial fiel al que enviaste
function BurgerFastLogo({ className = 'w-36' }: { className?: string }) {
    return (
        <svg viewBox="0 0 320 175" fill="none" className={className}>
            <path d="M 48 52 C 58 26, 85 18, 120 18 L 200 18 C 242 18, 268 38, 272 78" stroke="#DC2626" strokeWidth="12" strokeLinecap="round" />
            <line x1="42" y1="56" x2="108" y2="56" stroke="#DC2626" strokeWidth="9" strokeLinecap="round" />
            <text x="162" y="84" textAnchor="middle" fill="#DC2626" fontFamily="'Arial Black', Impact, sans-serif" fontWeight="900" fontStyle="italic" fontSize="38">BURGER</text>
            <line x1="232" y1="91" x2="274" y2="91" stroke="#DC2626" strokeWidth="9" strokeLinecap="round" />
            <line x1="42" y1="98" x2="132" y2="98" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />
            <text x="166" y="128" textAnchor="middle" fill="#FFFFFF" fontFamily="'Arial Black', Impact, sans-serif" fontWeight="900" fontStyle="italic" fontSize="38">FAST</text>
            <line x1="205" y1="133" x2="274" y2="133" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />
            <path d="M 48 118 C 56 146, 84 156, 120 156 L 200 156 C 236 156, 262 146, 270 133" stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round" />
        </svg>
    )
}

// Ciudad completa: casas bajas (h: 22-30), edificios (h: 50-85), torres (h: 100-130) y la Sucursal (hq: true)
const CITY = [
    { x: 47, y: 47, w: 62, d: 62, h: 120, hq: true }, // Sucursal Central BurgerFast
    // Sector Noroeste (Casas y edificios)
    { x: 14, y: 16, w: 34, d: 34, h: 24 }, { x: 21, y: 16, w: 34, d: 34, h: 28 },
    { x: 14, y: 24, w: 42, d: 38, h: 55 }, { x: 28, y: 18, w: 48, d: 48, h: 105 },
    { x: 35, y: 32, w: 40, d: 40, h: 68 }, { x: 22, y: 36, w: 36, d: 36, h: 30 },
    // Sector Noreste (Torres y manzanas comerciales)
    { x: 58, y: 15, w: 52, d: 52, h: 125 }, { x: 68, y: 18, w: 44, d: 44, h: 80 },
    { x: 78, y: 22, w: 36, d: 36, h: 32 }, { x: 60, y: 30, w: 46, d: 42, h: 62 },
    { x: 72, y: 34, w: 40, d: 40, h: 90 }, { x: 82, y: 36, w: 32, d: 32, h: 25 },
    // Sector Suroeste (Barrio de casas y edificios medios)
    { x: 14, y: 58, w: 32, d: 32, h: 22 }, { x: 20, y: 58, w: 32, d: 32, h: 26 },
    { x: 14, y: 66, w: 32, d: 32, h: 24 }, { x: 20, y: 66, w: 32, d: 32, h: 28 },
    { x: 29, y: 60, w: 45, d: 45, h: 75 }, { x: 36, y: 72, w: 48, d: 48, h: 98 },
    { x: 18, y: 78, w: 42, d: 38, h: 52 }, { x: 28, y: 80, w: 36, d: 36, h: 30 },
    // Sector Sureste (Centro urbano)
    { x: 58, y: 58, w: 50, d: 50, h: 110 }, { x: 69, y: 60, w: 42, d: 42, h: 65 },
    { x: 79, y: 62, w: 34, d: 34, h: 26 }, { x: 58, y: 72, w: 44, d: 44, h: 72 },
    { x: 68, y: 75, w: 52, d: 48, h: 118 }, { x: 80, y: 78, w: 36, d: 36, h: 45 },
]

export default function Home2() {
    const navigate = useNavigate()
    const { iniciarSesion } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [mostrarPassword, setMostrarPassword] = useState(false)
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setCargando(true)
        setError('')
        try {
            const admin = await iniciarSesionApi(email, password)
            const sesion: AdministradorSesion = {
                id: admin.id,
                nombre: admin.nombre,
                email: admin.email,
                rol: admin.rol,
                sucursalId: admin.sucursalId ?? null,
                sucursal: admin.sucursal ?? null,
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
        <main className="relative w-screen h-screen bg-[#030806] overflow-hidden flex items-center justify-center font-sans select-none">
            <style>{`
                @keyframes rotateCity { 0% { transform: rotateX(62deg) rotateZ(0deg); } 100% { transform: rotateX(62deg) rotateZ(360deg); } }
                .city-plane { transform-style: preserve-3d; animation: rotateCity 55s linear infinite; }
                .b3d { transform-style: preserve-3d; }
            `}</style>

            {/* Escenario 3D: Ciudad completa sobre cuadrícula verde */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ perspective: '950px' }}>
                <div
                    className="city-plane relative w-[950px] h-[950px]"
                    style={{
                        backgroundImage: `linear-gradient(to right, rgba(16,185,129,0.26) 1px, transparent 1px), linear-gradient(to bottom, rgba(16,185,129,0.26) 1px, transparent 1px)`,
                        backgroundSize: '42px 42px',
                    }}
                >
                    {CITY.map((b, i) => {
                        const c = b.hq ? '#ef4444' : '#10b981'
                        const bg = b.hq ? 'rgba(239,68,68,0.22)' : 'rgba(16,185,129,0.11)'
                        return (
                            <div key={i} className="b3d absolute" style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}px`, height: `${b.d}px` }}>
                                {/* Techo */}
                                <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white tracking-wider" style={{ background: b.hq ? 'rgba(220,38,38,0.45)' : 'rgba(16,185,129,0.24)', border: `1.5px solid ${c}`, transform: `translateZ(${b.h}px)` }}>
                                    {b.hq ? 'BF-HQ' : ''}
                                </div>
                                {/* Caras laterales */}
                                <div className="absolute bottom-0 origin-bottom" style={{ width: `${b.w}px`, height: `${b.h}px`, background: bg, border: `1px solid ${c}`, transform: 'rotateX(-90deg)' }} />
                                <div className="absolute top-0 origin-top" style={{ width: `${b.w}px`, height: `${b.h}px`, background: bg, border: `1px solid ${c}`, transform: 'rotateX(90deg)' }} />
                                <div className="absolute left-0 origin-left" style={{ width: `${b.h}px`, height: `${b.d}px`, background: bg, border: `1px solid ${c}`, transform: 'rotateY(90deg)' }} />
                                <div className="absolute right-0 origin-right" style={{ width: `${b.h}px`, height: `${b.d}px`, background: bg, border: `1px solid ${c}`, transform: 'rotateY(-90deg)' }} />
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Viñeta oscura en los bordes */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at center, transparent 22%, #030806 82%)' }} />

            {/* Tarjeta de Login Glassmorphism */}
            <div className="relative z-10 w-full max-w-[400px] mx-4 p-8 rounded-2xl bg-[#06120e]/75 backdrop-blur-md border border-emerald-500/30 shadow-[0_25px_50px_rgba(0,0,0,0.85)] text-slate-100">
                <div className="flex justify-center mb-3">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" /> RED BURGERFAST • ONLINE
                    </span>
                </div>

                <div className="flex flex-col items-center mb-5">
                    <BurgerFastLogo className="w-40 drop-shadow-[0_4px_12px_rgba(220,38,38,0.35)]" />
                    <p className="text-xs text-slate-400 mt-1">Administración • Stock, Pedidos y Flota</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Correo electrónico</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@burgerfast.com" required className="w-full px-3.5 py-2.5 rounded-lg bg-[#030a08]/85 border border-emerald-500/25 text-sm text-white outline-none focus:border-emerald-400" />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Contraseña</label>
                        <div className="relative">
                            <input type={mostrarPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="w-full px-3.5 py-2.5 pr-12 rounded-lg bg-[#030a08]/85 border border-emerald-500/25 text-sm text-white outline-none focus:border-emerald-400" />
                            <button type="button" onClick={() => setMostrarPassword(!mostrarPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-emerald-400 cursor-pointer">
                                {mostrarPassword ? 'Ocultar' : 'Ver'}
                            </button>
                        </div>
                    </div>

                    {error && <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg p-2 text-center">{error}</p>}

                    <button type="submit" disabled={cargando} className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-sm font-semibold shadow-[0_4px_14px_rgba(220,38,38,0.4)] transition cursor-pointer">
                        {cargando ? 'Ingresando...' : 'Iniciar sesión'}
                    </button>
                </form>
            </div>
        </main>
    )
}
