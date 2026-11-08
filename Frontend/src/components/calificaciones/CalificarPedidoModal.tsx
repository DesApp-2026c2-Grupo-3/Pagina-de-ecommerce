import { useState } from 'react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import Modal from '../Modal'
import ImagenProducto from '../ui/ImagenProducto'
import { CLASE_INPUT, CLASE_LABEL } from '../ui/formulario'
import { calificarPedido } from '../../services/calificacionService'
import type { CalificacionPendiente, RespuestaItem } from '../../types/calificacion'

const MAX_COMENTARIO = 300

const FRASES = ['Muy malo', 'Podría mejorar', 'Estuvo bien', 'Muy bueno', '¡Excelente!']

const SIN_RESPUESTA: RespuestaItem = { puntaje: 0, comentario: '' }

const BOTON =
  'inline-flex min-h-11 items-center justify-center rounded-full border-2 border-brand-dark px-5 text-sm font-bold shadow-sticker transition-transform hover:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0'

// Flecha redonda en el medio, a cada lado del modal, para pasar de un producto al otro
const FLECHA =
  'absolute top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border-2 border-brand-dark bg-white text-brand-dark shadow-sticker transition-transform hover:scale-105 active:scale-95'

const tieneAlgo = (r?: RespuestaItem) => Boolean(r && (r.puntaje > 0 || r.comentario.trim() !== ''))

interface CalificarPedidoModalProps {
  pendiente: CalificacionPendiente
  usuarioId: number
  /** Se cierra sin calificar (✕, Esc, fuera del cuadro o "Ahora no") */
  onDescartar: () => void
  /** Se cierra después de calificar */
  onTerminar: () => void
}

// Pide calificar el último pedido producto por producto: estrellas y comentario de cada uno son opcionales,
// pero para enviar hace falta calificar o comentar al menos uno. Se avanza con la flecha del medio. Se puede cerrar siempre.
export default function CalificarPedidoModal({ pendiente, usuarioId, onDescartar, onTerminar }: CalificarPedidoModalProps) {
  const { items } = pendiente
  const [indice, setIndice] = useState(0)
  const [respuestas, setRespuestas] = useState<Record<number, RespuestaItem>>({})
  const [vista, setVista] = useState(0) // estrella sobre la que está el mouse
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [enviado, setEnviado] = useState(false)

  const item = items[indice]
  if (!item) return null

  const actual = respuestas[item.productoId] ?? SIN_RESPUESTA
  const mostrado = vista || actual.puntaje
  const varios = items.length > 1
  const hayAlgoParaEnviar = Object.values(respuestas).some((r) => tieneAlgo(r))
  const fecha = new Date(pendiente.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })

  function cambiar(cambios: Partial<RespuestaItem>) {
    setRespuestas((prev) => ({ ...prev, [item.productoId]: { ...(prev[item.productoId] ?? SIN_RESPUESTA), ...cambios } }))
  }

  function irA(nuevo: number) {
    setVista(0)
    setIndice(nuevo)
  }

  async function enviar() {
    if (!hayAlgoParaEnviar || enviando) return
    setEnviando(true)
    setError('')
    try {
      await calificarPedido(usuarioId, pendiente.pedidoId, respuestas)
      setEnviado(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar tu calificación. Probá de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    return (
      <Modal isOpen onClose={onTerminar} title="¡Gracias!" tamanio="sm">
        <p className="text-sm">Tu opinión nos ayuda a mejorar cada pedido.</p>
        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onTerminar} className={`${BOTON} bg-brand-mustard`}>
            Listo
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      isOpen
      onClose={onDescartar}
      title="¿Cómo estuvo tu pedido?"
      subtitle={`Tu pedido del ${fecha}${pendiente.sucursal ? ` en ${pendiente.sucursal.nombre}` : ''}`}
    >
      <div className="relative">
        {varios && indice > 0 && (
          <button
            type="button"
            onClick={() => irA(indice - 1)}
            aria-label="Producto anterior"
            className={`${FLECHA} -left-5`}
          >
            <ChevronLeft size={20} />
          </button>
        )}
        {varios && indice < items.length - 1 && (
          <button
            type="button"
            onClick={() => irA(indice + 1)}
            aria-label="Producto siguiente"
            className={`${FLECHA} -right-5`}
          >
            <ChevronRight size={20} />
          </button>
        )}

        {/* Cada producto con su propio puntaje y comentario; se vuelve a montar al cambiar de producto */}
        <div key={item.productoId} className={varios ? 'px-4' : ''}>
          {varios && (
            <p className="mb-2 text-center text-xs font-bold uppercase tracking-wide text-brand-muted" aria-live="polite">
              Producto {indice + 1} de {items.length}
            </p>
          )}

          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-brand-dark bg-brand-sand">
              <ImagenProducto
                src={item.imagen}
                alt=""
                ancho={200}
                className="h-12 w-12 object-contain"
                claseIcono="h-8 w-8 text-brand-dark"
              />
            </div>
            <p className="min-w-0 font-display text-xl font-extrabold leading-tight">{item.nombre}</p>
          </div>

          <div
            role="radiogroup"
            aria-label={`Puntaje de ${item.nombre}`}
            className="flex justify-center gap-1"
            onMouseLeave={() => setVista(0)}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={actual.puntaje === n}
                aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
                // Volver a tocar la estrella elegida la saca: las estrellas son opcionales
                onClick={() => cambiar({ puntaje: actual.puntaje === n ? 0 : n })}
                onMouseEnter={() => setVista(n)}
                className="rounded p-1 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <Star
                  className={`h-9 w-9 sm:h-10 sm:w-10 ${n <= mostrado ? 'fill-brand-mustard text-brand-dark' : 'fill-white text-brand-dark/40'}`}
                  strokeWidth={1.75}
                />
              </button>
            ))}
          </div>
          <p className="mt-1 h-5 text-center text-sm font-semibold" aria-live="polite">
            {mostrado ? FRASES[mostrado - 1] : ''}
          </p>

          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor={`comentario-calificacion-${item.productoId}`} className={CLASE_LABEL}>
                Contanos más (opcional)
              </label>
              <span className="text-xs text-brand-muted">
                {actual.comentario.length}/{MAX_COMENTARIO}
              </span>
            </div>
            <textarea
              id={`comentario-calificacion-${item.productoId}`}
              value={actual.comentario}
              onChange={(e) => cambiar({ comentario: e.target.value })}
              maxLength={MAX_COMENTARIO}
              rows={3}
              placeholder="¿Qué te gustó? ¿Qué podemos mejorar?"
              className={`${CLASE_INPUT} w-full resize-none`}
            />
          </div>
        </div>
      </div>

      {varios && (
        <div className="mt-4 flex justify-center gap-1.5" aria-hidden="true">
          {items.map((it, i) => (
            <span
              key={it.productoId}
              className={`h-2.5 w-2.5 rounded-full border-2 border-brand-dark ${
                tieneAlgo(respuestas[it.productoId]) ? 'bg-brand-mustard' : 'bg-white'
              } ${i === indice ? 'scale-125' : 'opacity-60'}`}
            />
          ))}
        </div>
      )}

      {!hayAlgoParaEnviar && (
        <p className="mt-4 text-center text-xs text-brand-muted">
          Calificá al menos un producto o dejá un comentario para poder enviar.
        </p>
      )}

      {error && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p>}

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onDescartar} className={`${BOTON} bg-white`}>
          Ahora no
        </button>
        <button type="button" onClick={enviar} disabled={!hayAlgoParaEnviar || enviando} className={`${BOTON} bg-brand-mustard`}>
          {enviando ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
    </Modal>
  )
}
