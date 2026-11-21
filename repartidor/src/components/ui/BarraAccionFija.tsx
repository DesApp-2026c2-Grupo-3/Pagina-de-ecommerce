import type { ReactNode } from 'react'

// Cómo se ve en pantallas medianas y grandes (en el celular siempre queda pegada abajo):
// flujo: vuelve al flujo normal de la página.
// flotante: tarjeta pegada abajo de la ventana (la barra de selección de Pedidos).
// oculta: no se muestra; la pantalla tiene el botón en su lugar de siempre (Mi viaje).
type ModoEscritorio = 'flujo' | 'flotante' | 'oculta'

interface BarraAccionFijaProps {
  // La acción principal de la pantalla ("Tomar 2 pedidos", "Iniciar viaje")
  children: ReactNode
  // Una línea que explica por qué no se puede todavía, o qué va a pasar
  ayuda?: string
  enEscritorio?: ModoEscritorio
}

const ESCRITORIO: Record<ModoEscritorio, string> = {
  flujo: 'md:static md:mx-0 md:mt-6 md:mb-0 md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none',
  flotante:
    'md:bottom-4 md:mx-0 md:mt-6 md:mb-0 md:rounded-2xl md:border md:border-orange-200 md:p-4 md:px-6 md:shadow-xl md:shadow-slate-900/10',
  oculta: 'md:hidden',
}

// En el celular queda pegada abajo, encima de la barra de navegación, al alcance del pulgar.
// Tiene que ser hija directa del contenedor de la página para que "sticky" la acompañe.
// -mb-6 compensa el relleno inferior de <main> (1.5rem): sin eso, al llegar al final de la
// página la barra se despega 24 px de la navegación.
export default function BarraAccionFija({ children, ayuda, enEscritorio = 'flujo' }: BarraAccionFijaProps) {
  return (
    <div
      className={
        'sticky bottom-[var(--alto-nav-inferior)] z-20 -mx-4 mt-4 -mb-6 flex flex-col gap-2 border-t border-slate-200 ' +
        'bg-white/95 px-4 py-3 shadow-[0_-8px_20px_rgba(15,23,42,0.06)] backdrop-blur sm:-mx-6 sm:px-6 ' +
        ESCRITORIO[enEscritorio]
      }
    >
      {ayuda && <p className="text-center text-sm font-semibold text-slate-600 md:text-left">{ayuda}</p>}
      {children}
    </div>
  )
}
