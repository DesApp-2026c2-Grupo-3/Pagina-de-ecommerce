import { useEffect, useRef } from 'react'
import { Bell, LoaderCircle } from 'lucide-react'
import type { NotificacionCliente } from '../../types/notificacion.types'
import { useAhora } from '../../hooks/useAhora'
import ItemNotificacion from './ItemNotificacion'

interface Props {
  items: NotificacionCliente[]
  cargandoInicial: boolean
  cargandoMas: boolean
  hayMas: boolean
  onCargarMas: () => void
  onAbrir: (notificacion: NotificacionCliente) => void
}

// Carga, vacío o lista, con «Ver anteriores» al final (plan, DC-2)
function ListaNotificaciones({ items, cargandoInicial, cargandoMas, hayMas, onCargarMas, onAbrir }: Props) {
  const ahora = useAhora()
  const listaRef = useRef<HTMLUListElement>(null)
  // Posición del primer aviso que trae «Ver anteriores»: ahí va el foco cuando llegan
  const primeroNuevoRef = useRef<number | null>(null)

  useEffect(() => {
    const indice = primeroNuevoRef.current
    if (indice === null || items.length <= indice) return

    primeroNuevoRef.current = null
    listaRef.current?.querySelectorAll<HTMLButtonElement>(':scope > li > button')[indice]?.focus()
  }, [items.length])

  function verAnteriores() {
    primeroNuevoRef.current = items.length
    onCargarMas()
  }

  if (cargandoInicial && items.length === 0) {
    return (
      <div role="status" className="flex flex-col items-center gap-2 px-4 py-10 text-sm font-semibold text-brand-muted">
        <LoaderCircle aria-hidden="true" className="h-6 w-6 animate-spin" />
        Cargando notificaciones…
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-mustard/40">
          <Bell aria-hidden="true" className="h-6 w-6" />
        </span>
        <p className="font-bold">No tenés notificaciones todavía</p>
        <p className="text-sm text-brand-muted">Acá van a aparecer las novedades de tus pedidos.</p>
      </div>
    )
  }

  return (
    <div className="p-2">
      <ul ref={listaRef} className="space-y-1.5">
        {items.map((notificacion) => (
          <ItemNotificacion key={notificacion.id} notificacion={notificacion} ahora={ahora} onAbrir={onAbrir} />
        ))}
      </ul>

      {hayMas && (
        <div className="flex justify-center pb-1 pt-3">
          {cargandoMas ? (
            <span role="status" className="flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-muted">
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
              Cargando anteriores…
            </span>
          ) : (
            <button
              type="button"
              onClick={verAnteriores}
              className="min-h-11 rounded-full border-2 border-brand-dark bg-white px-5 text-sm font-extrabold text-brand-dark transition hover:bg-brand-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream"
            >
              Ver anteriores
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default ListaNotificaciones
