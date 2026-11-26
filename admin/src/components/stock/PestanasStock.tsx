import { Link } from 'react-router-dom'
import { rutaStock, type VistaStock } from '../../utils/navegacion/rutasStock'

const PESTANAS: { vista: VistaStock; etiqueta: string }[] = [
  { vista: 'insumos', etiqueta: 'Insumos' },
  { vista: 'movimientos', etiqueta: 'Movimientos' },
]

// Insumos | Movimientos: una al lado de la otra en todos los tamaños (D-S1, D-S5).
// Son enlaces: Atrás, recargar y abrir en otra pestaña funcionan.
export default function PestanasStock({ sucursalId, activa }: { sucursalId: number; activa: VistaStock }) {
  return (
    <nav aria-label="Secciones de stock" className="mb-4 flex border-b border-gray-200">
      {PESTANAS.map(({ vista, etiqueta }) => {
        const seleccionada = vista === activa
        return (
          <Link
            key={vista}
            to={rutaStock(sucursalId, vista)}
            aria-current={seleccionada ? 'page' : undefined}
            className={`-mb-px inline-flex min-h-11 flex-1 items-center justify-center border-b-2 px-5 font-semibold @xl:flex-none ${
              seleccionada
                ? 'border-action text-orange-700'
                : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
            }`}
          >
            {etiqueta}
          </Link>
        )
      })}
    </nav>
  )
}
