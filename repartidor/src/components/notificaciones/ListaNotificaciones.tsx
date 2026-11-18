import { Inbox } from 'lucide-react'

import type { Notificacion } from '../../notificaciones/catalogo'
import type { EstadoNotificaciones } from '../../types/notificacion.types'
import Boton from '../ui/Boton'
import EstadoError from '../ui/EstadoError'
import EstadoVacio from '../ui/EstadoVacio'
import Esqueleto from '../ui/Esqueleto'
import ItemNotificacion from './ItemNotificacion'

interface ListaNotificacionesProps {
  estado: EstadoNotificaciones
  ahora: number
  onAbrir: (notificacion: Notificacion) => void
  onReintentar: () => void
  onCargarMas: () => void
}

function FilaCargando() {
  return (
    <div className="flex gap-3 px-4 py-3.5">
      <Esqueleto className="size-10" circular />
      <div className="flex flex-1 flex-col gap-2 pt-1">
        <Esqueleto className="h-3.5 w-3/4" />
        <Esqueleto className="h-3 w-full" />
        <Esqueleto className="h-2.5 w-1/4" />
      </div>
    </div>
  )
}

// Zona desplazable (la única de la bandeja, plan UX 28) + pie fijo con "Ver anteriores"
export default function ListaNotificaciones({
  estado,
  ahora,
  onAbrir,
  onReintentar,
  onCargarMas,
}: ListaNotificacionesProps) {
  const { items, cargandoInicial, error, siguienteCursor, cargandoMas, errorCargaMas } = estado
  const vacia = items.length === 0

  let contenido
  if (vacia && cargandoInicial) {
    contenido = (
      <div aria-busy="true" aria-label="Cargando avisos">
        <FilaCargando />
        <FilaCargando />
        <FilaCargando />
      </div>
    )
  } else if (vacia && error) {
    contenido = <EstadoError titulo="No pudimos cargar tus avisos" mensaje={error} onReintentar={onReintentar} />
  } else if (vacia) {
    contenido = (
      <EstadoVacio
        icono={Inbox}
        titulo="No tenés avisos todavía"
        descripcion="Acá vas a ver cuando te asignen un viaje o cambie uno tuyo."
      />
    )
  } else {
    contenido = (
      <ul className="divide-y divide-slate-200">
        {items.map((notificacion) => (
          <ItemNotificacion key={notificacion.id} notificacion={notificacion} ahora={ahora} onAbrir={onAbrir} />
        ))}
      </ul>
    )
  }

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{contenido}</div>

      {!vacia && (siguienteCursor || errorCargaMas) && (
        <div className="flex shrink-0 flex-col gap-2 border-t border-slate-200 bg-white px-4 py-3">
          {errorCargaMas && (
            <p role="alert" className="text-center text-sm font-semibold text-red-700">
              {errorCargaMas}
            </p>
          )}
          {siguienteCursor && (
            <Boton
              variante="secundaria"
              anchoCompleto
              onClick={onCargarMas}
              cargando={cargandoMas}
              textoCargando="Cargando…"
            >
              Ver anteriores
            </Boton>
          )}
        </div>
      )}
    </>
  )
}
