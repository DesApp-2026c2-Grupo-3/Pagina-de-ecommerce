import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import type { AdministradorSesion } from '../types/sesion.types'
import { iniciarSesion as iniciarSesionApi } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import WaveVerticalPanels from '../components/WaveVerticalPanels'
import LogoConEco from '../components/logoEcoDestello'
import { MobileStormIntro } from '../components/MobileStormIntro'



const LOGO_EMPRESA_URL = '/logo.png'

export default function Home() {
  const navigate = useNavigate()
  const { iniciarSesion } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-2">

      {/* PABELLÓN IZQUIERDO: Noche estrellada */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-b from-[#090d16] via-[#11162b] to-[#1e1638] p-12 xl:p-16 text-slate-100 relative overflow-hidden">

        {/* Capa de estrellas en SVG */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-80"
          xmlns="http://w3.org"
        >
          <circle cx="12%" cy="18%" r="1.5" fill="#ffffff" opacity="0.9" />
          <circle cx="28%" cy="12%" r="1" fill="#c7d2fe" opacity="0.6" />
          <circle cx="45%" cy="22%" r="2" fill="#ffffff" opacity="0.8" />
          <circle cx="68%" cy="15%" r="1.2" fill="#e0e7ff" opacity="0.7" />
          <circle cx="84%" cy="25%" r="1.5" fill="#ffffff" opacity="0.9" />
          <circle cx="18%" cy="38%" r="1" fill="#a5b4fc" opacity="0.5" />
          <circle cx="35%" cy="44%" r="1.8" fill="#ffffff" opacity="0.85" />
          <circle cx="58%" cy="35%" r="1" fill="#ffffff" opacity="0.5" />
          <circle cx="76%" cy="42%" r="1.4" fill="#ddd6fe" opacity="0.75" />
          <circle cx="90%" cy="48%" r="1" fill="#ffffff" opacity="0.6" />
          <circle cx="10%" cy="62%" r="1.6" fill="#ffffff" opacity="0.8" />
          <circle cx="32%" cy="68%" r="1.2" fill="#c7d2fe" opacity="0.6" />
          <circle cx="52%" cy="58%" r="1.5" fill="#ffffff" opacity="0.9" />
          <circle cx="72%" cy="66%" r="1" fill="#a5b4fc" opacity="0.5" />
          <circle cx="88%" cy="74%" r="2" fill="#ffffff" opacity="0.85" />
          <circle cx="22%" cy="82%" r="1.3" fill="#e0e7ff" opacity="0.7" />
          <circle cx="48%" cy="86%" r="1" fill="#ffffff" opacity="0.5" />
          <circle cx="65%" cy="80%" r="1.7" fill="#ffffff" opacity="0.8" />
          <circle cx="82%" cy="90%" r="1.2" fill="#ddd6fe" opacity="0.6" />
        </svg>

        {/* Resplandores nebulosos sutiles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />

        {/* CENTRO SUPERIOR: Logotipo de la empresa */}
        <div className="relative z-10 w-full flex justify-center pt-2">
          <LogoConEco
            src={LOGO_EMPRESA_URL}
            isAuthenticated={false}
            className="h-36 sm:h-48"
          />
        </div>

        {/* ZONA MEDIA: Título bajado con ícono de Administración/Sistemas */}
        <div className="relative z-10 max-w-md my-auto pt-6">
          <div className="inline-flex items-center gap-2.5 bg-indigo-500/15 px-3.5 py-2 rounded-lg backdrop-blur-sm border border-indigo-400/25 mb-5">
            {/* Ícono de Panel de Administración / Sistemas */}
            <svg
              className="w-5 h-5 text-indigo-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
            <span className="font-semibold text-sm tracking-wide text-indigo-200">
              Sistema Central
            </span>
          </div>

          <h2 className="text-4xl font-bold leading-tight mb-4 text-white">
            Gestión y control en un solo lugar.
          </h2>
          <p className="text-indigo-200/80 text-base leading-relaxed">
            Accedé al panel administrativo para supervisar sucursales, operaciones y reportes en tiempo real.
          </p>
        </div>
        {/* ESTILOS DE LOS FOCOS REFLECTORES DE GALA */}
        <style>{`
          @keyframes barridoFocoIzquierdo {
            0%, 100% {
              transform: rotate(16deg) scaleX(0.95);
              opacity: 0.35;
              filter: blur(18px);
            }
            35% {
              transform: rotate(31deg) scaleX(1.18);
              opacity: 0.85;
              filter: blur(10px);
            }
            65% {
              transform: rotate(44deg) scaleX(0.9);
              opacity: 0.25;
              filter: blur(22px);
            }
          }

          @keyframes barridoFocoDerecho {
            0%, 100% {
              transform: rotate(-18deg) scaleX(0.95);
              opacity: 0.35;
              filter: blur(18px);
            }
            42% {
              transform: rotate(-32deg) scaleX(1.18);
              opacity: 0.85;
              filter: blur(10px);
            }
            72% {
              transform: rotate(-45deg) scaleX(0.9);
              opacity: 0.25;
              filter: blur(22px);
            }
          }

          .foco-izquierdo {
            transform-origin: bottom center;
            animation: barridoFocoIzquierdo 9s ease-in-out infinite;
          }

          .foco-derecho {
            transform-origin: bottom center;
            animation: barridoFocoDerecho 11s ease-in-out infinite;
          }
                      @keyframes barridoFocoIzquierdoMobile {
            0%, 100% { transform: rotate(8deg); opacity: 0.3; filter: blur(16px); }
            45%      { transform: rotate(19deg); opacity: 0.75; filter: blur(9px); }
            75%      { transform: rotate(26deg); opacity: 0.25; filter: blur(18px); }
          }

          @keyframes barridoFocoDerechoMobile {
            0%, 100% { transform: rotate(-8deg); opacity: 0.3; filter: blur(16px); }
            50%      { transform: rotate(-19deg); opacity: 0.75; filter: blur(9px); }
            80%      { transform: rotate(-26deg); opacity: 0.25; filter: blur(18px); }
          }

          .foco-izquierdo-mobile {
            transform-origin: bottom center;
            animation: barridoFocoIzquierdoMobile 9s ease-in-out infinite;
          }

          .foco-derecho-mobile {
            transform-origin: bottom center;
            animation: barridoFocoDerechoMobile 11s ease-in-out infinite;
          }

        `}</style>

        {/* DOS FOCOS REFLECTORES APUNTANDO HACIA ARRIBA DESDE LAS AZOTEAS */}
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden mix-blend-screen">
          {/* Foco Izquierdo */}
          <div
            className="foco-izquierdo absolute bottom-10 left-[8%] w-[420px] h-[115vh]"
            style={{
              background:
                'conic-gradient(from 346deg at 50% 100%, transparent 0deg, rgba(186, 230, 253, 0.35) 11deg, rgba(255, 255, 255, 0.72) 14deg, rgba(186, 230, 253, 0.35) 17deg, transparent 28deg)',
              WebkitMaskImage:
                'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.65) 60%, transparent 98%)',
              maskImage:
                'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.65) 60%, transparent 98%)',
            }}
          />

          {/* Foco Derecho */}
          <div
            className="foco-derecho absolute bottom-10 right-[8%] w-[420px] h-[115vh]"
            style={{
              background:
                'conic-gradient(from 346deg at 50% 100%, transparent 0deg, rgba(199, 210, 254, 0.35) 11deg, rgba(255, 255, 255, 0.72) 14deg, rgba(199, 210, 254, 0.35) 17deg, transparent 28deg)',
              WebkitMaskImage:
                'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.65) 60%, transparent 98%)',
              maskImage:
                'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.65) 60%, transparent 98%)',
            }}
          />
        </div>



        {/* HORIZONTE URBANO EN LA BASE DEL PABELLÓN IZQUIERDO (Solo escritorio lg:) */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-0 w-full overflow-hidden">
          <svg
            className="w-full h-36 xl:h-44 block"
            viewBox="0 0 1200 260"
            preserveAspectRatio="none"
            xmlns="http://w3.org"
          >
            <defs>
              <linearGradient id="lg-city-far" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#090d16" stopOpacity="0.85" />
              </linearGradient>
              <linearGradient id="lg-city-near" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#080b14" stopOpacity="0.96" />
                <stop offset="100%" stopColor="#030408" stopOpacity="1" />
              </linearGradient>
            </defs>

            <path
              fill="url(#lg-city-far)"
              d="M0,260 L0,175 L35,175 L35,110 L75,110 L75,155 L110,155 L110,55 L138,55 L138,38 L152,38 L152,18 L158,18 L158,38 L172,38 L172,55 L195,55 L195,140 L235,140 L235,85 L285,85 L285,165 L325,165 L325,42 L375,42 L375,125 L415,125 L415,150 L455,150 L455,68 L495,68 L495,30 L503,30 L503,68 L530,68 L530,135 L575,135 L575,90 L625,90 L625,160 L665,160 L665,25 L715,25 L715,105 L755,105 L755,145 L795,145 L795,52 L830,52 L830,20 L838,20 L838,52 L865,52 L865,130 L910,130 L910,75 L960,75 L960,158 L1005,158 L1005,40 L1055,40 L1055,115 L1100,115 L1100,82 L1145,82 L1145,140 L1200,140 L1200,260 Z"
            />

            <path
              fill="url(#lg-city-near)"
              d="M0,260 L0,195 L45,195 L45,140 L90,140 L90,180 L130,180 L130,92 L178,92 L178,165 L220,165 L220,118 L268,118 L268,188 L308,188 L308,76 L355,76 L355,148 L398,148 L398,185 L440,185 L440,105 L488,105 L488,162 L535,162 L535,84 L582,84 L582,172 L625,172 L625,65 L650,65 L650,48 L672,48 L672,65 L695,65 L695,152 L740,152 L740,182 L782,182 L782,95 L832,95 L832,160 L880,160 L880,112 L928,112 L928,178 L972,178 L972,72 L1022,72 L1022,145 L1068,145 L1068,108 L1115,108 L1115,168 L1160,168 L1160,135 L1200,135 L1200,260 Z"
            />

            <g fill="#fef08a" opacity="0.85">
              <rect x="142" y="108" width="4" height="7" rx="0.5" />
              <rect x="154" y="108" width="4" height="7" rx="0.5" />
              <rect x="142" y="124" width="4" height="7" rx="0.5" />
              <rect x="164" y="124" width="4" height="7" rx="0.5" />
              <rect x="320" y="92" width="4" height="7" rx="0.5" />
              <rect x="332" y="92" width="4" height="7" rx="0.5" />
              <rect x="320" y="108" width="4" height="7" rx="0.5" />
              <rect x="640" y="82" width="4" height="7" rx="0.5" />
              <rect x="654" y="82" width="4" height="7" rx="0.5" />
              <rect x="668" y="82" width="4" height="7" rx="0.5" />
              <rect x="640" y="100" width="4" height="7" rx="0.5" />
              <rect x="668" y="100" width="4" height="7" rx="0.5" />
              <rect x="985" y="88" width="4" height="7" rx="0.5" />
              <rect x="998" y="88" width="4" height="7" rx="0.5" />
              <rect x="985" y="106" width="4" height="7" rx="0.5" />
            </g>

            <g fill="#7dd3fc" opacity="0.75">
              <rect x="58" y="156" width="4" height="7" rx="0.5" />
              <rect x="234" y="134" width="4" height="7" rx="0.5" />
              <rect x="454" y="122" width="4" height="7" rx="0.5" />
              <rect x="550" y="102" width="4" height="7" rx="0.5" />
              <rect x="796" y="112" width="4" height="7" rx="0.5" />
              <rect x="895" y="128" width="4" height="7" rx="0.5" />
              <rect x="1082" y="124" width="4" height="7" rx="0.5" />
            </g>
          </svg>
        </div>

        {/* Pie */}
        <p className="relative z-10 text-xs text-indigo-300/60">
          © {new Date().getFullYear()} Portal de Administración
        </p>
      </div>

      {/* PABELLÓN DERECHO / CONTENEDOR DEL LOGIN */}



      <WaveVerticalPanels isFixed={false} iluminarMitadSuperior={true} className="flex items-center justify-center min-h-screen">
        <div className="relative w-full min-h-screen flex flex-col items-center justify-center py-4">

          <MobileStormIntro src={LOGO_EMPRESA_URL} isAuthenticated={false} />

          {/* TARJETA DE LOGIN CON ISOTIPO SIN SOLAPAR EL TÍTULO */}
          {/*<div className="relative z-20 mt-36 sm:mt-44 lg:mt-0 w-full max-w-[clamp(min(310px,calc(100vw-88px)),calc(310px+150*(100vw-420px)/220),460px)] md:max-w-[520px] lg:max-w-md bg-white/0 lg:bg-white/95   backdrop-blur-md p-6 pt-9 sm:p-8 sm:pt-11 lg:p-9 rounded-2xl shadow-[0_20px_50px_rgba(15,23,42,0.12)] border border-transparent border-t-sky-400/0 lg:border lg:border-white/70"> */}
          {/* CONTENEDOR 100% TRANSPARENTE EN MÓVIL (< lg) Y TARJETA CLÁSICA EN ESCRITORIO (lg:) */}
          <div className="relative z-20 mt-36 sm:mt-44 lg:mt-0 w-full max-w-[clamp(min(310px,calc(100vw-88px)),calc(310px+150*(100vw-420px)/220),460px)] md:max-w-[520px] lg:max-w-md bg-transparent lg:bg-white/95 backdrop-blur-none lg:backdrop-blur-md p-4 pt-9 sm:p-8 sm:pt-11 lg:p-9 rounded-2xl shadow-none lg:shadow-2xl border-none lg:border lg:border-white/70">




            {/* ISOTIPO SUBIDO UN ESCALÓN MÁS ARRIBA (-top-9 sm:-top-10) */}
            <div className="lg:hidden absolute -top-9 sm:-top-10 left-1/2 -translate-x-1/2 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-tr from-[#151933] to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-950/35 border-2 border-white/80 z-30">
              <svg
                className="w-8 h-8 sm:w-9 sm:h-9 text-indigo-200"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>


            {/* CABECERA INTERNA DEL FORMULARIO CON CONTRASTE NÍTIDO */}
            <div className="flex flex-col items-center mb-5 lg:mb-6">
              {/* Isotipo clásico interno solo para escritorio (lg:) */}
              <div className="hidden lg:flex w-16 h-16 bg-gradient-to-tr from-[#151933] to-indigo-700 rounded-2xl items-center justify-center shadow-lg shadow-indigo-900/25 mb-4 border border-indigo-400/20">
                <svg
                  className="w-9 h-9 text-indigo-200"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-sky-300 lg:text-slate-900 text-center tracking-tight">
                Administración
              </h1>
              <p className="text-sky-100 lg:text-slate-400 font-medium text-sm text-center mt-1">
                Iniciá sesión para continuar
              </p>
            </div>


            <form
              className="flex flex-col gap-4 sm:gap-5"
              onSubmit={async (e) => {
                e.preventDefault()

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
                }
              }}
            >
              {error && (
                <div className="bg-red-50/90 border-l-4 border-red-600 text-red-700 p-3 rounded text-sm text-center font-medium">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-semibold text-slate-800">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  type="email"
                  placeholder="admin@ejemplo.com"
                  required
                  className="border border-slate-300/80 rounded-lg px-3.5 py-2.5 text-slate-900 bg-white/75 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-semibold text-slate-800">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  placeholder="••••••••"
                  required
                  className="border border-slate-300/80 rounded-lg px-3.5 py-2.5 text-slate-900 bg-white/75 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                className="mt-2 bg-gradient-to-r from-[#191f42] to-indigo-800 hover:from-[#121630] hover:to-indigo-700 text-white rounded-lg py-2.5 font-semibold active:scale-[0.99] shadow-md shadow-indigo-950/25 transition-all cursor-pointer"
              >
                Iniciar sesión
              </button>
            </form>
          </div>

        </div>


                     {/* FOCOS REFLECTORES FOCALIZADOS: BASE FUERTE Y PUNTA CONCENTRADA ARRIBA (< lg) */}
        <div className="lg:hidden pointer-events-none fixed inset-0 z-10 overflow-hidden">
          
          {/* FOCO IZQUIERDO MÓVIL */}
          <div className="foco-izquierdo-mobile absolute bottom-8 left-[2%] sm:left-[10%] w-[190px] sm:w-[250px] h-[105vh]">
            {/* Base Roja Carmesí concentrada */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'conic-gradient(from 353deg at 50% 100%, transparent 0deg, rgba(220, 38, 38, 0.45) 4deg, rgba(255, 59, 92, 0.88) 7deg, rgba(220, 38, 38, 0.45) 10deg, transparent 14deg)',
                WebkitMaskImage:
                  'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 24%, rgba(0,0,0,0.4) 46%, transparent 62%)',
                maskImage:
                  'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 24%, rgba(0,0,0,0.4) 46%, transparent 62%)',
              }}
            />
            {/* Punta Amarillo Dorado estrecha y focalizada */}
            <div
              className="absolute inset-0 mix-blend-screen"
              style={{
                background:
                  'conic-gradient(from 353deg at 50% 100%, transparent 0deg, rgba(250, 204, 21, 0.45) 4deg, rgba(254, 240, 138, 0.9) 7deg, rgba(250, 204, 21, 0.45) 10deg, transparent 14deg)',
                WebkitMaskImage:
                  'linear-gradient(to top, transparent 32%, rgba(0,0,0,0.45) 52%, rgba(0,0,0,0.98) 76%, transparent 98%)',
                maskImage:
                  'linear-gradient(to top, transparent 32%, rgba(0,0,0,0.45) 52%, rgba(0,0,0,0.98) 76%, transparent 98%)',
              }}
            />
          </div>

          {/* FOCO DERECHO MÓVIL */}
          <div className="foco-derecho-mobile absolute bottom-8 right-[2%] sm:right-[10%] w-[190px] sm:w-[250px] h-[105vh]">
            {/* Base Roja Carmesí concentrada */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'conic-gradient(from 353deg at 50% 100%, transparent 0deg, rgba(220, 38, 38, 0.45) 4deg, rgba(255, 59, 92, 0.88) 7deg, rgba(220, 38, 38, 0.45) 10deg, transparent 14deg)',
                WebkitMaskImage:
                  'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 24%, rgba(0,0,0,0.4) 46%, transparent 62%)',
                maskImage:
                  'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 24%, rgba(0,0,0,0.4) 46%, transparent 62%)',
              }}
            />
            {/* Punta Amarillo Dorado estrecha y focalizada */}
            <div
              className="absolute inset-0 mix-blend-screen"
              style={{
                background:
                  'conic-gradient(from 353deg at 50% 100%, transparent 0deg, rgba(250, 204, 21, 0.45) 4deg, rgba(254, 240, 138, 0.9) 7deg, rgba(250, 204, 21, 0.45) 10deg, transparent 14deg)',
                WebkitMaskImage:
                  'linear-gradient(to top, transparent 32%, rgba(0,0,0,0.45) 52%, rgba(0,0,0,0.98) 76%, transparent 98%)',
                maskImage:
                  'linear-gradient(to top, transparent 32%, rgba(0,0,0,0.45) 52%, rgba(0,0,0,0.98) 76%, transparent 98%)',
              }}
            />
          </div>

        </div>






        {/* FOOTER PANORÁMICO DE SILUETAS DE CIUDAD CON EDIFICIOS ALTOS Y VARIADOS */}
        <div className="lg:hidden pointer-events-none fixed bottom-0 left-0 right-0 z-10 w-full overflow-hidden">
          <svg
            className="w-full h-36 sm:h-48 block"
            viewBox="0 0 1200 260"
            preserveAspectRatio="none"
            xmlns="http://w3.org"
          >
            <defs>
              {/* Capa lejana suave */}
              <linearGradient id="city-far" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#334155" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#1e293b" stopOpacity="0.62" />
              </linearGradient>

              {/* Capa frontal azul medianoche */}
              <linearGradient id="city-near" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" stopOpacity="0.88" />
                <stop offset="100%" stopColor="#090d16" stopOpacity="0.98" />
              </linearGradient>
            </defs>

            {/* CAPA 1: RASCACIELOS LEJANOS CON GRAN VARIACIÓN DE ALTURAS Y AGUJAS */}
            <path
              fill="url(#city-far)"
              d="M0,260 L0,175 L35,175 L35,110 L75,110 L75,155 L110,155 L110,55 L138,55 L138,38 L152,38 L152,18 L158,18 L158,38 L172,38 L172,55 L195,55 L195,140 L235,140 L235,85 L285,85 L285,165 L325,165 L325,42 L375,42 L375,125 L415,125 L415,150 L455,150 L455,68 L495,68 L495,30 L503,30 L503,68 L530,68 L530,135 L575,135 L575,90 L625,90 L625,160 L665,160 L665,25 L715,25 L715,105 L755,105 L755,145 L795,145 L795,52 L830,52 L830,20 L838,20 L838,52 L865,52 L865,130 L910,130 L910,75 L960,75 L960,158 L1005,158 L1005,40 L1055,40 L1055,115 L1100,115 L1100,82 L1145,82 L1145,140 L1200,140 L1200,260 Z"
            />

            {/* CAPA 2: HORIZONTE CERCANO CON BLOQUES ESCALONADOS Y TORRES ESBELTAS */}
            <path
              fill="url(#city-near)"
              d="M0,260 L0,195 L45,195 L45,140 L90,140 L90,180 L130,180 L130,92 L178,92 L178,165 L220,165 L220,118 L268,118 L268,188 L308,188 L308,76 L355,76 L355,148 L398,148 L398,185 L440,185 L440,105 L488,105 L488,162 L535,162 L535,84 L582,84 L582,172 L625,172 L625,65 L650,65 L650,48 L672,48 L672,65 L695,65 L695,152 L740,152 L740,182 L782,182 L782,95 L832,95 L832,160 L880,160 L880,112 L928,112 L928,178 L972,178 L972,72 L1022,72 L1022,145 L1068,145 L1068,108 L1115,108 L1115,168 L1160,168 L1160,135 L1200,135 L1200,260 Z"
            />

            {/* VENTANAS CÁLIDAS EN LOS RASCACIELOS */}
            <g fill="#fef08a" opacity="0.78">
              {/* Torre izquierda */}
              <rect x="142" y="108" width="4" height="7" rx="0.5" />
              <rect x="154" y="108" width="4" height="7" rx="0.5" />
              <rect x="142" y="124" width="4" height="7" rx="0.5" />
              <rect x="164" y="124" width="4" height="7" rx="0.5" />
              <rect x="154" y="140" width="4" height="7" rx="0.5" />

              {/* Torre centro-izquierda */}
              <rect x="320" y="92" width="4" height="7" rx="0.5" />
              <rect x="332" y="92" width="4" height="7" rx="0.5" />
              <rect x="320" y="108" width="4" height="7" rx="0.5" />
              <rect x="342" y="124" width="4" height="7" rx="0.5" />

              {/* Torre escalonada central */}
              <rect x="640" y="82" width="4" height="7" rx="0.5" />
              <rect x="654" y="82" width="4" height="7" rx="0.5" />
              <rect x="668" y="82" width="4" height="7" rx="0.5" />
              <rect x="640" y="100" width="4" height="7" rx="0.5" />
              <rect x="668" y="100" width="4" height="7" rx="0.5" />
              <rect x="654" y="118" width="4" height="7" rx="0.5" />

              {/* Torre derecha */}
              <rect x="985" y="88" width="4" height="7" rx="0.5" />
              <rect x="998" y="88" width="4" height="7" rx="0.5" />
              <rect x="985" y="106" width="4" height="7" rx="0.5" />
              <rect x="1008" y="122" width="4" height="7" rx="0.5" />
            </g>

            {/* VENTANAS CELESTES DE CONTRASTE */}
            <g fill="#bae6fd" opacity="0.65">
              <rect x="58" y="156" width="4" height="7" rx="0.5" />
              <rect x="234" y="134" width="4" height="7" rx="0.5" />
              <rect x="454" y="122" width="4" height="7" rx="0.5" />
              <rect x="550" y="102" width="4" height="7" rx="0.5" />
              <rect x="562" y="118" width="4" height="7" rx="0.5" />
              <rect x="796" y="112" width="4" height="7" rx="0.5" />
              <rect x="895" y="128" width="4" height="7" rx="0.5" />
              <rect x="1082" y="124" width="4" height="7" rx="0.5" />
            </g>
          </svg>
        </div>

      </WaveVerticalPanels>






    </main>
  )
}

