import { useState } from 'react'
import { Star } from 'lucide-react'
import Modal from '../Modal'
import { CLASE_INPUT, CLASE_LABEL } from '../ui/formulario'
import { calificarPedido } from '../../services/calificacionService'
import type { CalificacionPendiente } from '../../types/calificacion'

const MAX_COMENTARIO = 300

const FRASES = ['Muy malo', 'Podría mejorar', 'Estuvo bien', 'Muy bueno', '¡Excelente!']

const BOTON =
  'inline-flex min-h-11 items-center justify-center rounded-full border-2 border-brand-dark px-5 text-sm font-bold shadow-sticker transition-transform hover:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0'

interface CalificarPedidoModalProps {
  pendiente: CalificacionPendiente
  usuarioId: number
  /** Se cierra sin calificar (✕, Esc, fuera del cuadro o "Ahora no") */
  onDescartar: () => void
  /** Se cierra después de calificar */
  onTerminar: () => void
}

// Pide calificar el último pedido: estrellas (obligatorias) y un comentario opcional. Se puede cerrar siempre.
export default function CalificarPedidoModal({ pendiente, usuarioId, onDescartar, onTerminar }: CalificarPedidoModalProps) {
  const [puntaje, setPuntaje] = useState(0)
  const [vista, setVista] = useState(0) // estrella sobre la que está el mouse
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [enviado, setEnviado] = useState(false)

  const fecha = new Date(pendiente.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })
  const mostrado = vista || puntaje

  async function enviar() {
    if (puntaje === 0 || enviando) return
    setEnviando(true)
    setError('')
    try {
      await calificarPedido(usuarioId, pendiente.pedidoId, puntaje, comentario)
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
      {pendiente.productos.length > 0 && (
        <p className="mb-4 text-sm text-gray-700">{pendiente.productos.join(' · ')}</p>
      )}

      <div role="radiogroup" aria-label="Puntaje" className="flex justify-center gap-1" onMouseLeave={() => setVista(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={puntaje === n}
            aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
            onClick={() => setPuntaje(n)}
            onMouseEnter={() => setVista(n)}
            className="rounded p-1 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <Star
              className={`h-10 w-10 ${n <= mostrado ? 'fill-brand-mustard text-brand-dark' : 'fill-white text-brand-dark/40'}`}
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
          <label htmlFor="comentario-calificacion" className={CLASE_LABEL}>
            Contanos más (opcional)
          </label>
          <span className="text-xs text-brand-muted">
            {comentario.length}/{MAX_COMENTARIO}
          </span>
        </div>
        <textarea
          id="comentario-calificacion"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          maxLength={MAX_COMENTARIO}
          rows={3}
          placeholder="¿Qué te gustó? ¿Qué podemos mejorar?"
          className={`${CLASE_INPUT} w-full resize-none`}
        />
      </div>

      {error && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p>}

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onDescartar} className={`${BOTON} bg-white`}>
          Ahora no
        </button>
        <button type="button" onClick={enviar} disabled={puntaje === 0 || enviando} className={`${BOTON} bg-brand-mustard`}>
          {enviando ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
    </Modal>
  )
}
