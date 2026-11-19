import { NavLink } from 'react-router-dom'

import { ENLACES_NAVEGACION, RUTA_PEDIDOS } from './enlacesNavegacion'
import Insignia from '../ui/Insignia'
import { etiquetaPedidos } from '../../utils/etiquetaPedidos'

interface NavegacionSuperiorProps {
  // Pedidos que puede tomar (contador de la pestaña Pedidos); null: no se muestra
  pedidosParaTomar: number | null
}

// Pestañas de escritorio: las mismas de siempre (plan UX, sección 31). En el celular no se ven.
// La de Pedidos suma el contador de pedidos para tomar (v1.7).
export default function NavegacionSuperior({ pedidosParaTomar }: NavegacionSuperiorProps) {
  return (
    <nav aria-label="Principal" className="hidden border-b border-orange-100 bg-white md:block">
      <div className="mx-auto flex max-w-7xl gap-1 px-4 sm:px-6">
        {ENLACES_NAVEGACION.map(({ nombre, ruta, icono: Icono }) => (
          <NavLink
            key={ruta}
            to={ruta}
            end={ruta === '/'}
            aria-label={ruta === RUTA_PEDIDOS ? etiquetaPedidos(pedidosParaTomar) : undefined}
            className={({ isActive }) =>
              `flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? 'border-orange-500 bg-orange-50/70 text-orange-700'
                  : 'border-transparent text-slate-500 hover:bg-orange-50/50 hover:text-orange-700'
              }`
            }
          >
            <Icono size={18} aria-hidden="true" />
            {nombre}
            {ruta === RUTA_PEDIDOS && <Insignia cantidad={pedidosParaTomar} tono="marca" />}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
