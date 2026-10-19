import { useEffect, useState, type AnimationEvent } from 'react'

// Por si la animación no llega a terminar (pestaña en segundo plano), se cierra sola a los 6 s
const CIERRE_DE_SEGURIDAD_MS = 6000

// Capas de la hamburguesa, de arriba hacia abajo. Caen de abajo hacia arriba (la de abajo primero).
const CAPAS = [
  { clase: 'h-[86px] w-[230px] rounded-[120px_120px_22px_22px] bg-[#e8a33d]', delay: 1.35, sesamo: true },
  { clase: 'h-5 w-[250px] rounded-[14px] bg-[#6cbf3c]', delay: 1.1 }, // lechuga
  { clase: 'h-5 w-[232px] rounded-xl bg-brand-red', delay: 0.85 }, // tomate
  { clase: 'h-[18px] w-[240px] rounded-md bg-brand-mustard', delay: 0.6 }, // queso
  { clase: 'h-11 w-[236px] rounded-[22px] bg-[#6b2f1d]', delay: 0.35 }, // carne
  { clase: 'h-[46px] w-[226px] rounded-[10px_10px_30px_30px] bg-[#e8a33d]', delay: 0.1 }, // pan de abajo
]

const SESAMO = [
  { left: 60, top: 22, rot: -20 },
  { left: 104, top: 14, rot: 0 },
  { left: 148, top: 24, rot: 20 },
  { left: 82, top: 40, rot: 10 },
  { left: 128, top: 42, rot: -10 },
]

// Splash decorativo: se muestra cada vez que se carga (o recarga) la página entrando por el Home
function PantallaBienvenida() {
  const [visible, setVisible] = useState(() => window.location.pathname === '/')

  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => setVisible(false), CIERRE_DE_SEGURIDAD_MS)
    return () => clearTimeout(timer)
  }, [visible])

  // Se cierra cuando termina de subir el telón: queda sincronizado con la animación, aunque arranque tarde
  function alTerminarAnimacion(e: AnimationEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget && e.animationName === 'bf-telon') setVisible(false)
  }

  if (!visible) return null
  return (
    <div
      role="status"
      aria-label="Cargando BurgerFast"
      onAnimationEnd={alTerminarAnimacion}
      className="pantalla-carga bf-telon fixed inset-0 z-[70] flex flex-col items-center justify-center gap-7 overflow-hidden border-b-[6px] border-brand-red bg-brand-dark px-4"
    >
      {/* Rayos que giran de fondo */}
      <div
        aria-hidden="true"
        className="bf-rayos absolute left-1/2 top-1/2 -ml-[700px] -mt-[700px] h-[1400px] w-[1400px] rounded-full bg-[repeating-conic-gradient(rgba(255,184,28,0.06)_0deg_10deg,transparent_10deg_20deg)]"
      />

      {/* La hamburguesa se arma capa por capa */}
      <div aria-hidden="true" className="scale-75 sm:scale-100">
        <div className="bf-rebote relative flex flex-col items-center">
          {CAPAS.map((capa, i) => (
            <div
              key={i}
              className={`bf-capa relative border-4 border-brand-dark ${capa.clase} ${i > 0 ? '-mt-1' : ''}`}
              style={{ animationDelay: `${capa.delay}s` }}
            >
              {capa.sesamo &&
                SESAMO.map((s) => (
                  <span
                    key={s.left}
                    className="absolute h-[7px] w-3 rounded-full bg-brand-cream"
                    style={{ left: s.left, top: s.top, transform: `rotate(${s.rot}deg)` }}
                  />
                ))}
            </div>
          ))}
        </div>
      </div>

      {/* Marca */}
      <div className="relative flex flex-col items-center gap-2 text-center">
        <p
          className="bf-subir font-display text-6xl font-extrabold leading-none tracking-tight text-brand-cream sm:text-7xl"
          style={{ animationDelay: '1.6s' }}
        >
          <span className="text-brand-red">Burger</span>Fast
        </p>
        <p className="bf-subir text-lg font-bold text-brand-cream/70" style={{ animationDelay: '1.85s' }}>
          Prendiendo la plancha…
        </p>
        <span
          className="bf-pop absolute -right-10 -top-6 rounded-full border-[3px] border-brand-dark bg-brand-mustard px-4 py-1.5 font-display text-xl font-extrabold text-brand-dark sm:-right-20"
          style={{ animationDelay: '2.05s' }}
        >
          ¡Hola!
        </span>
      </div>

      {/* Barra de carga */}
      <div
        aria-hidden="true"
        className="relative h-3 w-72 overflow-hidden rounded-full border-[3px] border-brand-cream"
      >
        <div className="bf-barra-3s h-full rounded-full bg-brand-red" />
      </div>
    </div>
  )
}

export default PantallaBienvenida