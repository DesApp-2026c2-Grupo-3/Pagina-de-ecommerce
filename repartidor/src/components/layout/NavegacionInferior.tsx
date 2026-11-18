import { NavLink } from 'react-router-dom'
import { Bell } from 'lucide-react'

import { ENLACES_NAVEGACION } from './enlacesNavegacion'
import Insignia from '../ui/Insignia'
import { etiquetaAvisos } from '../../utils/etiquetaAvisos'
import { etiquetaPedidos } from '../../utils/etiquetaPedidos'
import { RUTA_PEDIDOS } from './enlacesNavegacion'

interface NavegacionInferiorProps {
  noLeidas: number | null
  // Pedidos que puede tomar (contador de la pestaña Pedidos); null: no se muestra
  pedidosParaTomar: number | null
  avisosAbiertos: boolean
  onAbrirAvisos: () => void
}

const MARCA_ACTIVA = (
  <span aria-hidden="true" className="absolute left-1/2 top-0 h-[3px] w-8 -translate-x-1/2 rounded-b bg-orange-700" />
)

// Barra inferior del celular (plan UX, UX-01): al alcance del pulgar, con la zona segura del
// teléfono abajo. Su alto es --alto-nav-inferior (index.css). En escritorio no se ve.
// La quinta pestaña, "Avisos", es la campana: abre la bandeja como hoja inferior.
export default function NavegacionInferior({
  noLeidas,
  pedidosParaTomar,
  avisosAbiertos,
  onAbrirAvisos,
}: NavegacionInferiorProps) {
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_0_0_var(--color-slate-200)] md:hidden"
    >
      <ul className="flex">
        {ENLACES_NAVEGACION.map(({ nombre, ruta, icono: Icono }) => (
          <li key={ruta} className="flex-1">
            <NavLink
              to={ruta}
              end={ruta === '/'}
              aria-label={ruta === RUTA_PEDIDOS ? etiquetaPedidos(pedidosParaTomar) : undefined}
              className={({ isActive }) =>
                `relative flex h-16 flex-col items-center justify-center gap-1 text-xs transition active:bg-orange-50 ${
                  isActive ? 'font-bold text-orange-700' : 'font-semibold text-slate-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && MARCA_ACTIVA}
                  <span className="relative flex">
                    <Icono size={22} aria-hidden="true" />
                    {ruta === RUTA_PEDIDOS && <Insignia cantidad={pedidosParaTomar} flotante tono="marca" />}
                  </span>
                  {nombre}
                </>
              )}
            </NavLink>
          </li>
        ))}

        <li className="flex-1">
          <button
            type="button"
            onClick={onAbrirAvisos}
            aria-label={etiquetaAvisos(noLeidas)}
            aria-haspopup="dialog"
            aria-expanded={avisosAbiertos}
            className={`relative flex h-16 w-full flex-col items-center justify-center gap-1 text-xs transition active:bg-orange-50 ${
              avisosAbiertos ? 'font-bold text-orange-700' : 'font-semibold text-slate-600'
            }`}
          >
            {avisosAbiertos && MARCA_ACTIVA}
            <span className="relative flex">
              <Bell size={22} aria-hidden="true" />
              <Insignia cantidad={noLeidas} flotante />
            </span>
            Avisos
          </button>
        </li>
      </ul>
    </nav>
  )
}
