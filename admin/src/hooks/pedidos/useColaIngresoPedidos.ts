import { useCallback, useEffect, useRef, useState } from 'react'
import type { Dispatch, FocusEvent, SetStateAction } from 'react'
import {
  COOLDOWN_INGRESO_MS,
  COOLDOWN_RAFAGA_MS,
  DURACION_RESALTADO_MS,
  PAUSA_TRAS_INTERACCION_MS,
  UMBRAL_RAFAGA,
} from '../../config/pedidos'
import type { PedidoFila } from '../../types/pedido.types'
import {
  liberarQueNoCoinciden,
  liberarSiguiente,
  liberarTodos,
  type EstadoCola,
} from '../../utils/pedidos/colaIngreso'

interface Opciones {
  estadoCola: EstadoCola
  setEstadoCola: Dispatch<SetStateAction<EstadoCola>>
  // ¿El filtro actual mostraría este pedido?
  coincide: (pedido: PedidoFila) => boolean
  // Carga, guardado, confirmación armada o página distinta de la 1
  pausado: boolean
}

// Inserta en la lista los pedidos encolados de a uno, con cooldown (plan responsivo, 4.2).
// Es el único dueño del timer. Nunca inserta mientras el puntero o el foco están en la lista,
// para que una tarjeta no se mueva justo cuando se va a hacer clic.
export function useColaIngresoPedidos({ estadoCola, setEstadoCola, coincide, pausado }: Opciones) {
  const [interactuando, setInteractuando] = useState(false)
  const [resaltados, setResaltados] = useState<number[]>([])
  const [anuncio, setAnuncio] = useState('')
  const [turno, setTurno] = useState(0)
  const estadoRef = useRef(estadoCola)
  const salidaRef = useRef<number | null>(null)
  const timersResaltado = useRef(new Set<number>())
  const rafagaAnunciada = useRef(false)

  useEffect(() => {
    estadoRef.current = estadoCola
  }, [estadoCola])

  // Limpieza de timers al salir de la pantalla
  useEffect(() => {
    const timers = timersResaltado.current
    return () => {
      timers.forEach((id) => window.clearTimeout(id))
      if (salidaRef.current !== null) window.clearTimeout(salidaRef.current)
    }
  }, [])

  const resaltar = useCallback((ids: number[]) => {
    if (ids.length === 0) return
    setResaltados((previos) => [...new Set([...previos, ...ids])])
    const timer = window.setTimeout(() => {
      timersResaltado.current.delete(timer)
      setResaltados((previos) => previos.filter((id) => !ids.includes(id)))
    }, DURACION_RESALTADO_MS)
    timersResaltado.current.add(timer)
  }, [])

  // Los encolados que el filtro no mostraría entran sin gastar turno ni animación
  // (en un timer de 0 ms: el efecto no cambia estado de forma sincrónica)
  const hayNoVisibles = estadoCola.cola.some((pedido) => !coincide(pedido))
  useEffect(() => {
    if (!hayNoVisibles) return
    const timer = window.setTimeout(() => {
      setEstadoCola((previo) => liberarQueNoCoinciden(previo, coincide).estado)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [coincide, hayNoVisibles, setEstadoCola])

  const enCola = estadoCola.cola.length
  useEffect(() => {
    if (enCola === 0) rafagaAnunciada.current = false
  }, [enCola])

  // El timer depende de si HAY cola, no de su contenido: una recarga en medio no lo reinicia
  const hayCola = enCola > 0
  useEffect(() => {
    if (!hayCola || pausado || interactuando) return
    const demora = estadoRef.current.cola.length > UMBRAL_RAFAGA ? COOLDOWN_RAFAGA_MS : COOLDOWN_INGRESO_MS
    const timer = window.setTimeout(() => {
      const siguiente = estadoRef.current.cola[0]
      if (!siguiente) return
      const enEspera = estadoRef.current.cola.length
      setEstadoCola((previo) => liberarSiguiente(previo).estado)
      resaltar([siguiente.id])
      // En ráfaga, un solo anuncio resumido para el lector de pantalla
      if (enEspera > UMBRAL_RAFAGA && !rafagaAnunciada.current) {
        rafagaAnunciada.current = true
        setAnuncio(`Ingresan ${enEspera} pedidos nuevos.`)
      } else if (!rafagaAnunciada.current) {
        setAnuncio(`Ingresó el pedido #${siguiente.id}.`)
      }
      setTurno((n) => n + 1)
    }, demora)
    return () => window.clearTimeout(timer)
  }, [hayCola, pausado, interactuando, turno, resaltar, setEstadoCola])

  // «Mostrar ahora»
  const liberarTodo = useCallback(() => {
    const ids = estadoRef.current.cola.map((pedido) => pedido.id)
    if (ids.length === 0) return
    setEstadoCola((previo) => liberarTodos(previo).estado)
    resaltar(ids)
    setAnuncio(ids.length === 1 ? `Ingresó el pedido #${ids[0]}.` : `Se muestran ${ids.length} pedidos nuevos.`)
  }, [resaltar, setEstadoCola])

  const entrar = useCallback(() => {
    if (salidaRef.current !== null) window.clearTimeout(salidaRef.current)
    salidaRef.current = null
    setInteractuando(true)
  }, [])

  const salir = useCallback(() => {
    if (salidaRef.current !== null) window.clearTimeout(salidaRef.current)
    salidaRef.current = window.setTimeout(() => {
      salidaRef.current = null
      setInteractuando(false)
    }, PAUSA_TRAS_INTERACCION_MS)
  }, [])

  const propsInteraccion = {
    onPointerEnter: entrar,
    onPointerLeave: salir,
    onFocus: entrar,
    onBlur: (evento: FocusEvent<HTMLElement>) => {
      // Solo cuenta como salida si el foco se fue fuera de la lista
      if (!evento.currentTarget.contains(evento.relatedTarget as Node | null)) salir()
    },
  }

  return { resaltados, anuncio, enCola, liberarTodo, propsInteraccion }
}
