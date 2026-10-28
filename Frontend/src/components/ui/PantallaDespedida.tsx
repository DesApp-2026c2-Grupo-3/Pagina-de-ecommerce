import { useEffect, useState, type AnimationEvent } from 'react'
import { EVENTO_DESPEDIDA } from '../../utils/despedida'

// Por si la animación no llega a terminar (pestaña en segundo plano), se cierra sola a los 5 s
const CIERRE_DE_SEGURIDAD_MS = 5000

// Las mismas capas que la hamburguesa de bienvenida, de arriba hacia abajo
const CAPAS = [
  'h-[86px] w-[230px] rounded-[120px_120px_22px_22px] bg-[#e8a33d]', // pan de arriba
  'h-5 w-[250px] rounded-[14px] bg-[#6cbf3c]', // lechuga
  'h-5 w-[232px] rounded-xl bg-brand-red', // tomate
  'h-[18px] w-[240px] rounded-md bg-brand-mustard', // queso
  'h-11 w-[236px] rounded-[22px] bg-[#6b2f1d]', // carne
  'h-[46px] w-[226px] rounded-[10px_10px_30px_30px] bg-[#e8a33d]', // pan de abajo
]

// Sésamo arriba del pan, dejando lugar para los ojos
const SESAMO = [
  { left: 60, top: 18, rot: -20 },
  { left: 109, top: 10, rot: 0 },
  { left: 158, top: 18, rot: 20 },
  { left: 36, top: 44, rot: -30 },
  { left: 182, top: 44, rot: 30 },
]

// Cortina roja con la hamburguesa que saluda. Aparece al cerrar sesión, desde donde sea.
function PantallaDespedida() {
  // null = no se muestra; string = nombre de la persona que se va
  const [nombre, setNombre] = useState<string | null>(null)

  useEffect(() => {
    function alDespedir(e: Event) {
      setNombre((e as CustomEvent<string>).detail)
    }
    window.addEventListener(EVENTO_DESPEDIDA, alDespedir)
    return () => window.removeEventListener(EVENTO_DESPEDIDA, alDespedir)
  }, [])

  useEffect(() => {
    if (nombre === null) return
    const timer = setTimeout(() => setNombre(null), CIERRE_DE_SEGURIDAD_MS)
    return () => clearTimeout(timer)
  }, [nombre])

  // Se cierra cuando termina de desvanecerse
  function alTerminarAnimacion(e: AnimationEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget && e.animationName === 'bf-salida') setNombre(null)
  }

  if (nombre === null) return null

  return (
    <div
      role="status"
      aria-label="Cerrando sesión"
      onAnimationEnd={alTerminarAnimacion}
      className="pantalla-carga bf-cortina fixed inset-0 z-[70] flex flex-col items-center justify-center gap-8 overflow-hidden border-t-[6px] border-brand-dark bg-brand-red px-4 text-center"
    >
      {/* Cartel colgante */}
      <div aria-hidden="true" className="bf-cartel flex flex-col items-center">
        <div className="h-12 w-[3px] bg-brand-dark" />
        <div className="rounded-2xl border-[3px] border-brand-dark bg-brand-cream px-7 py-3 font-display text-2xl font-extrabold tracking-widest text-brand-dark shadow-[6px_6px_0_var(--color-brand-dark)]">
          VOLVÉ PRONTO
        </div>
      </div>

         {/* Hamburguesa completa (como la de bienvenida) que guiña y saluda */}
      <div aria-hidden="true" className="scale-75 sm:scale-100">
        <div className="relative flex flex-col items-center">
          {CAPAS.map((clase, i) => (
            <div key={i} className={`relative border-4 border-brand-dark ${clase} ${i > 0 ? '-mt-1' : ''}`}>
              {i === 0 && (
                <>
                  {SESAMO.map((s) => (
                    <span
                      key={s.left}
                      className="absolute h-[7px] w-3 rounded-full bg-brand-cream"
                      style={{ left: s.left, top: s.top, transform: `rotate(${s.rot}deg)` }}
                    />
                  ))}
                  <span className="bf-guinio absolute left-[78px] top-[40px] h-[18px] w-[14px] rounded-full bg-brand-dark" />
                  <span className="bf-guinio absolute right-[78px] top-[40px] h-[18px] w-[14px] rounded-full bg-brand-dark" />
                </>
              )}
            </div>
          ))}

          {/* Brazo izquierdo, quieto */}
          <div className="absolute -left-[38px] top-[150px] h-16 w-10">
            <div className="absolute left-4 top-0 h-[34px] w-2 rounded bg-brand-dark" />
            <div className="absolute bottom-0 left-0.5 h-9 w-9 rounded-full border-4 border-brand-dark bg-brand-cream" />
          </div>

          {/* Brazo derecho, saludando */}
          <div className="bf-saludo absolute -right-[54px] top-[90px] h-16 w-10">
            <div className="absolute bottom-0 left-4 h-[34px] w-2 rounded bg-brand-dark" />
            <div className="absolute left-0.5 top-0 h-9 w-9 rounded-full border-4 border-brand-dark bg-brand-cream" />
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <p
          className="bf-subir font-display text-4xl font-extrabold leading-none tracking-tight text-brand-cream sm:text-6xl"
          style={{ animationDelay: '0.55s' }}
        >
          ¡Hasta pronto{nombre ? `, ${nombre}` : ''}!
        </p>
        <p className="bf-subir text-lg font-bold text-brand-cream/85" style={{ animationDelay: '0.75s' }}>
          Cerramos tu sesión. La plancha te espera.
        </p>
      </div>
    </div>
  )
}

export default PantallaDespedida