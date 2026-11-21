import { useId, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'

import Dialogo from '../ui/Dialogo'
import Boton from '../ui/Boton'
import type { Motivo, SolicitudAsistencia } from '../../types/viaje.types'

interface ModalSolicitudAyudaProps {
  abierto: boolean
  enviando: boolean
  error: string
  onCerrar: () => void
  onConfirmar: (datos: SolicitudAsistencia) => void
}

// Etiquetas de una línea para el celular; al servidor va el motivo completo
const MOTIVOS: { valor: Motivo; etiqueta: string }[] = [
  { valor: 'Problema con el vehículo', etiqueta: 'Vehículo' },
  { valor: 'Accidente', etiqueta: 'Accidente' },
  { valor: 'Problema personal', etiqueta: 'Personal' },
  { valor: 'Otro', etiqueta: 'Otro' },
]

// v1.9 (D-25): 150 caracteres entran completos en 4 renglones, sin scroll, a 360 px
const MAXIMO_COMENTARIO = 150

// El cuadro crece con el texto en vez de mostrar scroll (W-7). Con texto común, 150 caracteres
// entran en los 4 renglones de base; solo crece con letras muy anchas.
function ajustarAlto(cuadro: HTMLTextAreaElement) {
  cuadro.style.height = 'auto'
  // scrollHeight no incluye el borde (box-sizing: border-box): se lo suma
  const borde = cuadro.offsetHeight - cuadro.clientHeight
  cuadro.style.height = `${cuadro.scrollHeight + borde}px`
}

// Versión compacta (W-7): entra entera en 360 × 640 sin scroll interno. El motivo es un grupo
// de 4 opciones en lugar de un select y los textos van a 16 px para que iOS no haga zoom.
export default function ModalSolicitudAyuda({ abierto, enviando, error, onCerrar, onConfirmar }: ModalSolicitudAyudaProps) {
  const [motivo, setMotivo] = useState<Motivo | null>(null)
  const [comentario, setComentario] = useState('')
  const [errorValidacion, setErrorValidacion] = useState('')
  const idComentario = useId()
  const cuadroComentario = useRef<HTMLTextAreaElement>(null)

  // Al cerrar sin enviar se descarta lo cargado: la próxima vez arranca de cero
  const cerrar = () => {
    setMotivo(null)
    setComentario('')
    setErrorValidacion('')
    if (cuadroComentario.current) cuadroComentario.current.style.height = ''
    onCerrar()
  }

  const confirmar = () => {
    if (!motivo) {
      setErrorValidacion('Seleccioná un motivo para continuar.')
      return
    }

    setErrorValidacion('')
    onConfirmar({ motivo, comentario: comentario.trim() || undefined })
  }

  const mensajeError = errorValidacion || error

  return (
    <Dialogo
      abierto={abierto}
      titulo="Solicitar asistencia"
      onCerrar={cerrar}
      bloquearCierre={enviando}
      icono={
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
          <AlertTriangle size={20} />
        </span>
      }
    >
      <fieldset disabled={enviando} className="m-0 min-w-0 border-0 p-0">
        <legend className="mb-2 text-sm font-bold text-slate-700">Motivo de asistencia</legend>

        <div className="grid grid-cols-2 gap-2">
          {MOTIVOS.map(({ valor, etiqueta }) => (
            <label
              key={valor}
              className={
                'flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border-2 px-3 text-base font-semibold ' +
                'text-slate-800 transition has-[:checked]:border-red-700 has-[:checked]:bg-red-50 ' +
                'has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-orange-300 ' +
                'border-slate-200'
              }
            >
              <input
                type="radio"
                name="motivo-asistencia"
                value={valor}
                checked={motivo === valor}
                onChange={() => {
                  setMotivo(valor)
                  setErrorValidacion('')
                }}
                className="size-5 shrink-0 accent-red-700 focus:outline-none"
              />
              {etiqueta}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <label htmlFor={idComentario} className="text-sm font-bold text-slate-700">
            Comentario (opcional)
          </label>
          <span className="text-xs font-semibold text-slate-600">
            {comentario.length}/{MAXIMO_COMENTARIO}
          </span>
        </div>

        <textarea
          ref={cuadroComentario}
          id={idComentario}
          value={comentario}
          onChange={(evento) => {
            setComentario(evento.target.value)
            ajustarAlto(evento.target)
          }}
          maxLength={MAXIMO_COMENTARIO}
          rows={4}
          disabled={enviando}
          placeholder="Explicá brevemente qué sucedió..."
          className={
            'block w-full resize-none overflow-hidden rounded-xl border-2 border-slate-200 px-3 py-2 text-base text-slate-900 ' +
            'placeholder:text-slate-500 focus:border-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-100 ' +
            'disabled:cursor-not-allowed disabled:opacity-60'
          }
        />
      </div>

      <p className="text-sm leading-snug text-slate-600">
        Administración recibe tu pedido junto con tu ubicación actual, si está disponible.
      </p>

      {mensajeError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700">
          {mensajeError}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Boton variante="secundaria" anchoCompleto onClick={cerrar} disabled={enviando}>
          Cancelar
        </Boton>
        <Boton variante="peligro" anchoCompleto onClick={confirmar} cargando={enviando} textoCargando="Enviando…">
          Solicitar ayuda
        </Boton>
      </div>
    </Dialogo>
  )
}
