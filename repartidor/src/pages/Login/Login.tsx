import { useAuth } from '../../context/AuthContext'
import LoginForm from '../../components/login/LoginForm'
import logoDeliverFast from '../../assets/logoD.png'

export default function Login() {
  const { login } = useAuth()
  const loops = [1, 2]

  return (
    <main className="relative flex h-screen overflow-hidden w-full flex-col overflow-hidden bg-slate-950 font-sans lg:flex-row">
      <style>{`
        @keyframes moveClouds {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes moveRoadLines {
          0% { transform: translateX(0); }
          100% { transform: translateX(-120px); }
        }
        @keyframes moveScenery {
          0% { transform: translateX(0); }
          100% { transform: translateX(-800px); }
        }
        @keyframes driveAcross {
          0% { transform: translateX(-180px); }
          100% { transform: translateX(110vw); }
        }
        @keyframes engineBounce {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
        }
        @keyframes wheelSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-clouds {
          animation: moveClouds 45s linear infinite;
        }
        .animate-road {
          animation: moveRoadLines 0.6s linear infinite;
        }
        .animate-cactus {
          animation: moveScenery 10s linear infinite;
        }
        .animate-moto-drive {
          animation: driveAcross 8.5s linear infinite;
        }
        .animate-moto-bounce {
          animation: engineBounce 0.25s ease-in-out infinite;
        }
        .animate-wheel {
          transform-box: fill-box;
          transform-origin: center;
          animation: wheelSpin 0.4s linear infinite;
        }
                  @keyframes sunArc {
          0% { transform: translate(45vw, 90px); opacity: 0; }
          10% { opacity: 1; }
          25% { transform: translate(0vw, -10px); }
          40% { opacity: 1; }
          50% { transform: translate(-48vw, 90px); opacity: 0; }
          100% { transform: translate(-48vw, 90px); opacity: 0; }
        }
        @keyframes moonArc {
          0%, 48% { transform: translate(45vw, 90px); opacity: 0; }
          58% { opacity: 1; }
          75% { transform: translate(0vw, -10px); }
          90% { opacity: 1; }
          100% { transform: translate(-48vw, 90px); opacity: 0; }
        }
        @keyframes nightSkyFade {
          0%, 42% { opacity: 0; }
          52%, 92% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes dynamicMobileText {
          0%, 42% { color: #0f172a; text-shadow: 0 1px 4px rgba(255,255,255,0.4); }
          52%, 92% { color: #fef3c7; text-shadow: 0 2px 12px rgba(253,230,138,0.45); }
          100% { color: #0f172a; }
        }
                       @keyframes sunSemicircle {
          0% { transform: rotate(75deg); opacity: 0; }
          5% { opacity: 1; }
          42% { opacity: 1; }
          48% { transform: rotate(-75deg); opacity: 0; }
          100% { transform: rotate(-75deg); opacity: 0; }
        }
        @keyframes moonSemicircle {
          0%, 50% { transform: rotate(75deg); opacity: 0; }
          55% { opacity: 1; }
          92% { opacity: 1; }
          98% { transform: rotate(-75deg); opacity: 0; }
          100% { transform: rotate(-75deg); opacity: 0; }
        }
        @keyframes counterSun {
          0% { transform: rotate(-75deg); }
          48%, 100% { transform: rotate(75deg); }
        }
        @keyframes counterMoon {
          0%, 50% { transform: rotate(-75deg); }
          98%, 100% { transform: rotate(75deg); }
        }
        .animate-sun-orbit {
          animation: sunSemicircle 24s linear infinite;
        }
        .animate-moon-orbit {
          animation: moonSemicircle 24s linear infinite;
        }
        .animate-sun-counter {
          animation: counterSun 24s linear infinite;
        }
        .animate-moon-counter {
          animation: counterMoon 24s linear infinite;
        }


        .animate-night-sky {
          animation: nightSkyFade 24s ease-in-out infinite;
        }
        .animate-mobile-text,
        .animate-mobile-text label {
          animation: dynamicMobileText 24s ease-in-out infinite;
        }

      `}</style>

      {/* PANEL IZQUIERDO: Paisaje de DÍA */}
      <section className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-gradient-to-b from-sky-400 via-amber-100 to-orange-200 lg:w-1/2">
        {/* Capa de Cielo Nocturno Estrellado (Solo en <lg cuando cae la noche) */}
        <div className="animate-night-sky pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 lg:hidden">
          <span className="absolute left-[18%] top-12 h-1 w-1 rounded-full bg-amber-100 opacity-80" />
          <span className="absolute left-[35%] top-20 h-1.5 w-1.5 rounded-full bg-white opacity-70" />
          <span className="absolute left-[68%] top-14 h-1 w-1 rounded-full bg-amber-100 opacity-85" />
          <span className="absolute left-[82%] top-28 h-1.5 w-1.5 rounded-full bg-amber-200 opacity-75" />
          <span className="absolute left-[24%] top-36 h-1 w-1 rounded-full bg-white opacity-50" />
        </div>

        {/* Sol Fijo para Escritorio (lg+) */}
        <div className="pointer-events-none hidden lg:block">
          <div className="absolute right-16 top-12 h-24 w-24 rounded-full bg-amber-300/80 blur-sm shadow-[0_0_60px_rgba(251,191,36,0.8)]" />
          <div className="absolute right-18 top-14 h-20 w-20 rounded-full bg-yellow-100" />
        </div>

        {/* Órbita Semicircular Idéntica de Sol y Luna en Móvil (<lg) */}
        <div className="pointer-events-none absolute left-1/2 top-72 h-0 w-0 lg:hidden">
          {/* Trayecto del SOL (0% a 48% del ciclo) */}
          <div className="animate-sun-orbit absolute inset-0">
            <div className="animate-sun-counter absolute -left-10 -top-64">
              <div className="h-20 w-20 rounded-full bg-amber-300/80 blur-sm shadow-[0_0_60px_rgba(251,191,36,0.9)]" />
              <div className="absolute inset-2 rounded-full bg-yellow-100" />
            </div>
          </div>

          {/* Trayecto IDÉNTICO de la LUNA LLENA (50% a 98% del ciclo) */}
          <div className="animate-moon-orbit absolute inset-0">
            <div className="animate-moon-counter absolute -left-10 -top-64">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200 shadow-[0_0_45px_rgba(253,230,138,0.8)]">
                <div className="absolute left-4 top-5 h-3 w-3 rounded-full bg-amber-300/35" />
                <div className="absolute bottom-4 right-5 h-4 w-4 rounded-full bg-amber-300/30" />
              </div>
            </div>
          </div>
        </div>





        {/* Textos y Logo de escritorio */}
        <div className="relative z-20 hidden px-12 pt-14 lg:block">
          <div className="mb-6">
            <img
              src={logoDeliverFast}
              alt="Deliver Fast"
              className="h-24 w-auto object-contain drop-shadow-sm"
            />
          </div>

          <div>
            <p className="mb-3 inline-block rounded-full bg-slate-900/20 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-white drop-shadow-[0_1px_4px_rgba(15,23,42,0.3)] backdrop-blur-sm">
              Panel de repartidores
            </p>
          </div>

          <h1 className="text-4xl font-extrabold leading-tight xl:text-5xl">
            <span className="text-white drop-shadow-[0_2px_10px_rgba(15,23,42,0.28)]">
              Cada entrega cuenta.
            </span>
            <span className="block text-[#B82925]">Cada recorrido importa.</span>
          </h1>

          <p className="mt-4 max-w-md text-sm font-medium leading-relaxed text-slate-800">
            Accedé a tus pedidos, organizá tus entregas y mantené el control de cada recorrido.
          </p>
        </div>
        {/* Formulario transparente móvil (<lg) con adaptación día/noche */}
        <div className="animate-mobile-text relative z-30 mx-auto mt-28 w-full max-w-md px-6 sm:mt-36 lg:hidden">
          <div className="mb-6 text-center">
            {/* Título grande de marca */}
            <div className="mb-2 text-4xl font-black tracking-tight drop-shadow-[0_2px_10px_rgba(15,23,42,0.35)]">
              <span className="!text-[#B82925]">Deliver</span>
              <span className="!text-white">Fast</span>
            </div>

            <span className="inline-block rounded-full bg-slate-900/25 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest !text-white backdrop-blur-sm">
              Panel de repartidores
            </span>
            <h2 className="mt-3 text-3xl font-extrabold">
              ¡Bienvenido!
            </h2>
            <p className="mt-1 text-sm font-medium opacity-90">
              Ingresá con tu cuenta para salir a repartir.
            </p>
          </div>


          <div className="[&_label]:font-semibold">
            <LoginForm onSubmit={login} />
          </div>

          <p className="mt-6 text-center text-xs font-medium opacity-85">
            Acceso exclusivo para repartidores registrados.
          </p>
        </div>


        {/* ESCENARIO INFERIOR DÍA: Montañas y Arena */}
        <div className="pointer-events-none relative mt-auto h-56 w-full sm:h-64 lg:h-[34vh] lg:max-h-80">

          <svg className="absolute bottom-24 h-40 w-full lg:bottom-28 lg:h-48" viewBox="0 0 800 200" preserveAspectRatio="none">
            <polygon points="0,200 180,60 360,200" fill="#d97706" opacity="0.35" />
            <polygon points="280,200 520,40 760,200" fill="#b45309" opacity="0.3" />
            <polygon points="550,200 720,80 850,200" fill="#d97706" opacity="0.4" />
            <polygon points="-50,200 120,100 290,200" fill="#c2410c" opacity="0.45" />
            <polygon points="400,200 620,90 820,200" fill="#9a3412" opacity="0.4" />
          </svg>

          <div className="absolute bottom-0 h-28 w-full bg-gradient-to-b from-amber-500 to-orange-600 lg:h-32" />
          <div className="absolute bottom-0 z-20 h-6 w-full bg-orange-800 lg:h-8" />
        </div>
      </section>

      {/* PANEL DERECHO DE ESCRITORIO: Paisaje NOCTURNO con Luna Llena y Form sin logo */}
      <section className="relative hidden h-full w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 lg:flex">

        {/* Estrellas sutiles en el cielo */}
        <div className="pointer-events-none absolute inset-0">
          <span className="absolute left-[14%] top-12 h-1 w-1 rounded-full bg-amber-100 opacity-80" />
          <span className="absolute left-[28%] top-24 h-1.5 w-1.5 rounded-full bg-white opacity-60" />
          <span className="absolute left-[62%] top-14 h-1 w-1 rounded-full bg-amber-100 opacity-75" />
          <span className="absolute left-[42%] top-10 h-1 w-1 rounded-full bg-white opacity-50" />
          <span className="absolute left-[75%] top-36 h-1.5 w-1.5 rounded-full bg-amber-200 opacity-70" />
          <span className="absolute left-[18%] top-44 h-1 w-1 rounded-full bg-white opacity-40" />
        </div>

        {/* Luna Llena brillante con halo */}
        <div className="pointer-events-none absolute right-14 top-10 h-28 w-28 rounded-full bg-amber-200/20 blur-xl" />
        <div className="pointer-events-none absolute right-16 top-12 h-24 w-24 rounded-full bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200 shadow-[0_0_50px_rgba(253,230,138,0.65)]">
          <div className="absolute left-5 top-6 h-4 w-4 rounded-full bg-amber-300/30" />
          <div className="absolute bottom-5 right-6 h-5 w-5 rounded-full bg-amber-300/25" />
          <div className="absolute right-7 top-5 h-2.5 w-2.5 rounded-full bg-amber-300/30" />
        </div>

        {/* FORMULARIO CENTRADO SIN LOGO */}
        <div className="relative z-30 mx-auto my-auto flex w-full max-w-md flex-col px-8 pb-24 pt-12">
          <div className="mb-6 w-full text-left">
            <div className="mb-2 text-4xl font-black tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
              <span className="text-[#B82925]">Deliver</span>
              <span className="text-white">Fast</span>
            </div>

            <h2 className="text-3xl font-extrabold text-[#fef3c7] [text-shadow:0_2px_12px_rgba(253,230,138,0.55)]">
              ¡Bienvenido!
            </h2>

            <p className="mt-1.5 text-sm font-medium text-amber-100/90">
              Ingresá con tu cuenta de repartidor para continuar.
            </p>
          </div>


          <div className="w-full [&_label]:font-semibold [&_label]:text-amber-100">
            <LoginForm onSubmit={login} />
          </div>

          <p className="mt-6 text-center text-xs font-medium text-amber-200/75">
            Acceso exclusivo para repartidores registrados.
          </p>
        </div>

        {/* ESCENARIO INFERIOR NOCTURNO: Montañas y Arena oscura */}
        <div className="pointer-events-none relative mt-auto h-[34vh] max-h-80 w-full">

          <svg className="absolute bottom-28 h-48 w-full" viewBox="0 0 800 200" preserveAspectRatio="none">
            <polygon points="0,200 160,75 340,200" fill="#1e1b4b" opacity="0.75" />
            <polygon points="240,200 480,45 720,200" fill="#312e81" opacity="0.55" />
            <polygon points="520,200 710,85 850,200" fill="#1e1b4b" opacity="0.8" />
            <polygon points="-40,200 140,105 320,200" fill="#0f172a" opacity="0.85" />
            <polygon points="420,200 640,95 830,200" fill="#1e293b" opacity="0.8" />
          </svg>

          <div className="absolute bottom-0 h-32 w-full bg-gradient-to-b from-slate-900 to-slate-950" />
          <div className="absolute bottom-0 z-20 h-8 w-full bg-slate-950" />
        </div>
      </section>
      {/* CINTA CONTINUA GLOBAL (Cruza toda la pantalla de Día a Noche) */}

      {/* 1. Nubes continuas cruzando el cielo completo */}
      <div className="animate-clouds pointer-events-none absolute left-0 top-0 z-10 flex h-44 w-[200%] pt-4 opacity-65">
        {loops.map((idx) => (
          <div key={idx} className="relative h-full w-1/2">
            <svg className="absolute left-[8%] top-4 h-16 w-32 fill-current text-white" viewBox="0 0 100 40">
              <path d="M25,35 C12,35 5,28 5,20 C5,12 12,6 22,6 C26,2 34,0 42,2 C50,0 60,4 64,12 C75,12 85,18 85,26 C85,32 78,35 70,35 Z" />
            </svg>
            <svg className="absolute left-[32%] top-12 h-20 w-40 fill-current text-white/85" viewBox="0 0 100 40">
              <path d="M20,36 C10,36 4,30 4,22 C4,15 10,10 18,10 C22,4 32,2 40,5 C48,2 58,6 62,14 C72,14 80,20 80,27 C80,33 74,36 65,36 Z" />
            </svg>
            <svg className="absolute left-[62%] top-6 h-16 w-36 fill-current text-slate-200/50" viewBox="0 0 100 40">
              <path d="M25,35 C12,35 5,28 5,20 C5,12 12,6 22,6 C26,2 34,0 42,2 C50,0 60,4 64,12 C75,12 85,18 85,26 C85,32 78,35 70,35 Z" />
            </svg>
            <svg className="absolute left-[85%] top-14 h-20 w-44 fill-current text-slate-300/40" viewBox="0 0 100 40">
              <path d="M20,36 C10,36 4,30 4,22 C4,15 10,10 18,10 C22,4 32,2 40,5 C48,2 58,6 62,14 C72,14 80,20 80,27 C80,33 74,36 65,36 Z" />
            </svg>
          </div>
        ))}
      </div>

      {/* 2. Cinta continua de Cactus cruzando todo el horizonte */}
      <div className="animate-cactus pointer-events-none absolute bottom-20 left-0 z-20 flex h-28 w-[3200px] lg:bottom-24">
        {[0, 1, 2, 3].map((loop) => (
          <div key={loop} className="relative h-full w-[800px]">
            <svg className="absolute bottom-2 left-[15%] h-24 w-12 fill-current text-emerald-900/90" viewBox="0 0 60 120">
              <rect x="24" y="10" width="12" height="110" rx="6" />
              <path d="M24,55 L12,55 Q6,55 6,48 L6,30 Q6,25 11,25 Q16,25 16,30 L16,45 L24,45 Z" />
              <path d="M36,70 L48,70 Q54,70 54,63 L54,42 Q54,37 49,37 Q44,37 44,42 L44,60 L36,60 Z" />
            </svg>
            <svg className="absolute bottom-4 left-[48%] h-16 w-9 fill-current text-emerald-800/90" viewBox="0 0 60 120">
              <rect x="24" y="15" width="12" height="105" rx="6" />
              <path d="M36,60 L48,60 Q54,60 54,53 L54,35 Q54,30 49,30 Q44,30 44,35 L44,50 L36,50 Z" />
            </svg>
            <div className="absolute bottom-1 left-[68%] h-4 w-8 rounded-t-full bg-slate-900/50" />
            <svg className="absolute bottom-2 left-[85%] h-20 w-10 fill-current text-emerald-950/95" viewBox="0 0 60 120">
              <rect x="24" y="10" width="12" height="110" rx="6" />
              <path d="M24,65 L12,65 Q6,65 6,58 L6,38 Q6,33 11,33 Q16,33 16,38 L16,55 L24,55 Z" />
            </svg>
          </div>
        ))}
      </div>

      {/* 3. Ruta horizontal continua de punta a punta */}
      <div className="pointer-events-none absolute bottom-6 left-0 z-20 flex h-14 w-full items-center overflow-hidden border-y-4 border-slate-700 bg-slate-800 shadow-inner lg:bottom-8 lg:h-16">
        <div className="animate-road flex w-[200%]">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="mr-14 h-2 w-16 shrink-0 rounded-sm bg-amber-400" />
          ))}
        </div>
      </div>

      {/* 4. Motociclista cruzando toda la pantalla (Día y Noche) */}
      <div className="animate-moto-drive pointer-events-none absolute bottom-10 left-0 z-30 lg:bottom-12">
        <div className="animate-moto-bounce">
          <svg className="h-20 w-32 drop-shadow-md lg:h-24 lg:w-36" viewBox="0 0 180 120" fill="none">
            <circle cx="18" cy="88" r="4" fill="#cbd5e1" opacity="0.6" />
            <circle cx="8" cy="84" r="6" fill="#cbd5e1" opacity="0.35" />

            <g className="animate-wheel">
              <circle cx="48" cy="92" r="18" fill="#1e293b" stroke="#0f172a" strokeWidth="4" />
              <circle cx="48" cy="92" r="8" fill="#94a3b8" />
              <line x1="48" y1="74" x2="48" y2="110" stroke="#475569" strokeWidth="2" />
              <line x1="30" y1="92" x2="66" y2="92" stroke="#475569" strokeWidth="2" />
            </g>

            <g className="animate-wheel">
              <circle cx="136" cy="92" r="18" fill="#1e293b" stroke="#0f172a" strokeWidth="4" />
              <circle cx="136" cy="92" r="8" fill="#94a3b8" />
              <line x1="136" y1="74" x2="136" y2="110" stroke="#475569" strokeWidth="2" />
              <line x1="118" y1="92" x2="154" y2="92" stroke="#475569" strokeWidth="2" />
            </g>

            <path d="M52 92 L24 88 L24 94 L52 96 Z" fill="#64748b" />
            <line x1="116" y1="54" x2="136" y2="92" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />

            <path d="M46 84 L68 62 L112 62 L124 76 L96 88 L52 88 Z" fill="#B82925" />
            <path d="M86 58 Q102 50 116 62 L92 66 Z" fill="#dc2626" />
            <path d="M62 60 L90 60 L88 66 L60 66 Z" fill="#1e293b" />

            <rect x="34" y="58" width="28" height="4" fill="#334155" />
            <rect x="28" y="28" width="34" height="30" rx="4" fill="#B82925" stroke="#7f1d1d" strokeWidth="2" />
            <rect x="26" y="26" width="38" height="6" rx="2" fill="#991b1b" />
            <rect x="30" y="40" width="30" height="5" fill="#ffffff" opacity="0.9" />

            <path d="M78 62 L84 82 L96 86" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="92" y="84" width="12" height="5" rx="2" fill="#f8fafc" />
            <path d="M74 60 L82 36 L98 40 L92 62 Z" fill="#0f172a" />
            <path d="M88 42 L106 52 L116 52" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="112" y1="50" x2="120" y2="54" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
            <circle cx="123" cy="56" r="4" fill="#fef08a" />
            <polygon points="126,53 165,44 165,68 126,59" fill="#fef08a" opacity="0.35" />

            <circle cx="92" cy="24" r="13" fill="#B82925" />
            <path d="M96 18 L105 20 L104 28 L94 27 Z" fill="#0f172a" />
            <line x1="98" y1="20" x2="103" y2="21" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </main>
  )
}
