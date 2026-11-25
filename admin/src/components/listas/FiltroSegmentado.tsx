import { formatearContador } from '../../utils/listas/formatoContador'
import MenuFiltro from './MenuFiltro'

interface Opcion<T extends string> {
  valor: T
  etiqueta: string
}

interface Props<T extends string> {
  // Identifica los controles (ids y grupo de radios únicos por pantalla)
  id: string
  // Para lectores de pantalla: «Filtrar por etapa», «Filtrar por estado»
  leyenda: string
  opciones: Opcion<T>[]
  valor: T
  contadores: Record<T, number>
  onChange: (valor: T) => void
  // 'botones': lado a lado (solo escritorio) · 'desplegable': tablet y móvil
  variante: 'botones' | 'desplegable'
  className?: string
}

// Filtro de una sola opción compartido por Pedidos, Viajes, Stock y Repartidores. La pantalla dibuja las dos
// variantes y el CSS (container query de 60 rem) muestra una sola: la oculta queda con
// display:none, así el lector de pantalla no la anuncia dos veces. Nunca hay scroll horizontal.
export default function FiltroSegmentado<T extends string>({
  id,
  leyenda,
  opciones,
  valor,
  contadores,
  onChange,
  variante,
  className = '',
}: Props<T>) {
  if (variante === 'desplegable') {
    // Tablet, móvil y laptops angostas: menú propio en lugar del <select> nativo (plan de filtros v2)
    return (
      <MenuFiltro
        id={`${id}-menu`}
        etiqueta={leyenda}
        opciones={opciones.map((opcion) => {
          const cantidad = contadores[opcion.valor] ?? 0
          return {
            valor: opcion.valor,
            texto: opcion.etiqueta,
            contador: { visible: formatearContador(cantidad), real: cantidad },
          }
        })}
        valor={valor}
        onChange={(elegido) => {
          const opcion = opciones.find((o) => o.valor === elegido)
          if (opcion) onChange(opcion.valor)
        }}
        className={className}
      />
    )
  }

  return (
    <fieldset className={className}>
      <legend className="sr-only">{leyenda}</legend>
      <div className="flex flex-nowrap gap-2">
        {opciones.map((opcion) => {
          const activa = opcion.valor === valor
          return (
            <label
              key={opcion.valor}
              className={`relative inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-full border px-3.5 text-sm font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-action has-[:focus-visible]:ring-offset-2 ${
                activa
                  ? 'border-action bg-action text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name={`${id}-botones`}
                value={opcion.valor}
                checked={activa}
                onChange={() => onChange(opcion.valor)}
                className="sr-only"
              />
              {/* gap-1 separa etiqueta y contador (en flex se pierde el espacio).
                  Se ve «99+»; el lector de pantalla escucha el número real */}
              {opcion.etiqueta}
              <span aria-hidden="true">({formatearContador(contadores[opcion.valor] ?? 0)})</span>
              <span className="sr-only">({contadores[opcion.valor] ?? 0})</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
