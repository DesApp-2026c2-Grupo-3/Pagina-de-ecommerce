import { useCallback, useEffect, useRef, useState, type FocusEvent } from 'react'
import { X } from 'lucide-react'

import BotonIcono from '../ui/BotonIcono'
import Boton from '../ui/Boton'
import { TONOS } from '../../notificaciones/tonos'
import { DURACION_MS, DURACION_SALIDA_MS } from './tiempos'
import type { DatosToast } from '../../types/toast.types'

interface ToastProps {
  toast: DatosToast
  onCerrar: (id: string) => void
}

// Una tarjeta flotante. Se cierra con la X (44 px), con su acción o sola al cumplirse el
// tiempo, que se pausa mientras el dedo, el mouse o el foco están encima, y mientras la app
// está en segundo plano (UX-6). Sin gestos (W-2).
export default function Toast({ toast, onCerrar }: ToastProps) {
  const { id, tono, icono: Icono, titulo, descripcion, prioridad, accion } = toast
  const [encima, setEncima] = useState(false)
  const [conFoco, setConFoco] = useState(false)
  // Con la pestaña o la app en segundo plano el tiempo no corre: el repartidor lo ve al volver
  const [oculta, setOculta] = useState(() => document.visibilityState === 'hidden')
  const [saliendo, setSaliendo] = useState(false)
  const restante = useRef(DURACION_MS[prioridad])
  const inicioTramo = useRef(0)
  const corriendo = useRef(false)
  const pausado = encima || conFoco || oculta

  useEffect(() => {
    if (pausado || saliendo) return

    inicioTramo.current = Date.now()
    corriendo.current = true
    const temporizador = setTimeout(() => setSaliendo(true), restante.current)
    return () => clearTimeout(temporizador)
  }, [pausado, saliendo])

  useEffect(() => {
    if (!saliendo) return

    const temporizador = setTimeout(() => onCerrar(id), DURACION_SALIDA_MS)
    return () => clearTimeout(temporizador)
  }, [id, onCerrar, saliendo])

  // Al pausar (por el motivo que sea) se guarda cuánto tiempo le quedaba
  const pausar = useCallback((marcar: () => void) => {
    if (corriendo.current) {
      restante.current = Math.max(0, restante.current - (Date.now() - inicioTramo.current))
      corriendo.current = false
    }
    marcar()
  }, [])

  useEffect(() => {
    const alCambiarVisibilidad = () => {
      if (document.visibilityState === 'hidden') pausar(() => setOculta(true))
      else setOculta(false)
    }

    document.addEventListener('visibilitychange', alCambiarVisibilidad)
    return () => document.removeEventListener('visibilitychange', alCambiarVisibilidad)
  }, [pausar])

  const manejarPerdidaDeFoco = (evento: FocusEvent<HTMLDivElement>) => {
    if (!evento.currentTarget.contains(evento.relatedTarget)) setConFoco(false)
  }

  const tocarAccion = () => {
    accion?.alTocar()
    onCerrar(id)
  }

  return (
    <div
      onPointerEnter={() => pausar(() => setEncima(true))}
      onPointerLeave={() => setEncima(false)}
      onFocus={() => pausar(() => setConFoco(true))}
      onBlur={manejarPerdidaDeFoco}
      className={
        'flex overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-900/10 ' +
        (saliendo ? 'animate-toast-salida' : 'animate-toast-entrada motion-reduce:animate-toast-aparecer')
      }
    >
      <span aria-hidden="true" className={`w-1.5 shrink-0 ${TONOS[tono].barra}`} />

      <div className="flex min-w-0 flex-1 items-start gap-3 py-3 pr-1 pl-3">
        <span
          aria-hidden="true"
          className={`flex size-10 shrink-0 items-center justify-center rounded-full ${TONOS[tono].circulo}`}
        >
          <Icono size={20} />
        </span>

        <div className="flex min-w-0 flex-1 flex-col items-start gap-2 pt-0.5">
          {/* Solo el texto es la región en vivo: los botones no se leen en el anuncio */}
          <div role={prioridad === 'alta' ? 'alert' : 'status'} className="flex flex-col gap-0.5">
            <p className="text-[15px] leading-snug font-bold text-slate-900">{titulo}</p>
            {descripcion && <p className="text-sm leading-snug text-slate-600">{descripcion}</p>}
          </div>

          {accion && (
            <Boton variante="secundaria" onClick={tocarAccion}>
              {accion.texto}
            </Boton>
          )}
        </div>

        <BotonIcono icono={X} etiqueta="Cerrar aviso" onClick={() => setSaliendo(true)} />
      </div>
    </div>
  )
}
