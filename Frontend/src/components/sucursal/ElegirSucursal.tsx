import { useState } from 'react'
import { ChevronDown, Store } from 'lucide-react'
import { useZona } from '../../context/ZonaContext'
import { estadoSucursal } from '../../utils/horario'

interface Props {
  /** Se llama después de elegir (por ejemplo, para cerrar el modal) */
  onElegida?: () => void
}

const formatearKm = (km: number) => km.toLocaleString('es-AR', { maximumFractionDigits: 1 })

// La sucursal elegida, con "Cambiar": al tocarlo se despliegan las otras que llegan a la dirección.
// Con una sola no muestra nada (no hay nada que elegir).
function ElegirSucursal({ onElegida }: Props) {
  const { zona, opcionesSucursal, cambiarSucursal } = useZona()
  const [abierto, setAbierto] = useState(false)
  if (!zona || opcionesSucursal.length < 2) return null

  const elegida = opcionesSucursal.find((o) => o.sucursal.id === zona.sucursalId) ?? opcionesSucursal[0]
  const otras = opcionesSucursal.filter((o) => o.sucursal.id !== elegida.sucursal.id)
  const abiertaAhora = (o: (typeof opcionesSucursal)[number]) =>
    estadoSucursal(o.sucursal.horario, o.sucursal.zona_horaria).abierta

  return (
    <div className="rounded-[1.75rem] border-2 border-brand-dark bg-white">
      {/* La elegida, siempre a la vista */}
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-red text-white">
          <Store className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-extrabold">{elegida.sucursal.nombre}</span>
          <span className="block text-sm text-brand-muted">
            a {formatearKm(elegida.distancia)} km · {abiertaAhora(elegida) ? 'Abierta' : 'Cerrada ahora'}
          </span>
        </span>
        <button
          type="button"
          onClick={() => setAbierto((valor) => !valor)}
          aria-expanded={abierto}
          aria-controls="otras-sucursales"
          className="inline-flex shrink-0 items-center gap-1 rounded-full border-2 border-brand-dark px-4 py-2 text-sm font-bold transition-colors hover:bg-brand-dark hover:text-brand-cream"
        >
          Cambiar
          <ChevronDown className={`h-4 w-4 transition-transform ${abierto ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Las demás, desplegables */}
      {abierto && (
        <ul id="otras-sucursales" className="border-t-2 border-dashed border-brand-sand">
          {otras.map((o) => (
            <li key={o.sucursal.id}>
              <button
                type="button"
                onClick={() => {
                  cambiarSucursal(o.sucursal.id)
                  setAbierto(false)
                  onElegida?.()
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-cream"
              >
                <Store className="h-5 w-5 shrink-0 text-brand-muted" />
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{o.sucursal.nombre}</span>
                  <span className="block text-sm text-brand-muted">
                    a {formatearKm(o.distancia)} km · {abiertaAhora(o) ? 'Abierta' : 'Cerrada ahora'}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-bold text-brand-red">Elegir</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ElegirSucursal