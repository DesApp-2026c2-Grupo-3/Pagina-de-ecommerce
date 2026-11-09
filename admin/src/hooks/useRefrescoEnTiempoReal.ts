import { useEffect, useRef } from 'react'
import { useRealtime } from '../context/realtime/RealtimeContext'
import type {
  DominioRefresco,
  EventoRefrescoAdmin,
  EventoRealtime,
} from '../types/realtime.types'

interface OpcionesRefresco {
  dominios: DominioRefresco[]
  sucursalId?: number | null
  debounceMs?: number
  pausado?: boolean
  revalidarAlReconectar?: boolean
  revalidarAlVolverVisible?: boolean
  onRefrescar: (
    evento: EventoRefrescoAdmin | null,
    eventos: EventoRefrescoAdmin[],
  ) => void | Promise<void>
}

const DEBOUNCE_POR_DEFECTO = 350
const VENTANA_DEDUPLICACION_MS = 10_000

function ordenarEventos(eventos: EventoRefrescoAdmin[]) {
  return [...eventos].sort((a, b) => {
    const diferencia = Date.parse(a.ocurridoEn) - Date.parse(b.ocurridoEn)
    if (diferencia !== 0) return diferencia
    return a.eventoId.localeCompare(b.eventoId)
  })
}

export function useRefrescoEnTiempoReal({
  dominios,
  sucursalId,
  debounceMs = DEBOUNCE_POR_DEFECTO,
  pausado = false,
  revalidarAlReconectar = true,
  revalidarAlVolverVisible = true,
  onRefrescar,
}: OpcionesRefresco) {
  const { suscribir } = useRealtime()
  const opcionesRef = useRef({
    dominios,
    sucursalId,
    debounceMs,
    pausado,
    revalidarAlReconectar,
    revalidarAlVolverVisible,
    onRefrescar,
  })
  useEffect(() => {
    opcionesRef.current = {
      dominios,
      sucursalId,
      debounceMs,
      pausado,
      revalidarAlReconectar,
      revalidarAlVolverVisible,
      onRefrescar,
    }
  })

  const timerRef = useRef<number | null>(null)
  const programarRef = useRef<(demora: number) => void>(() => {})
  const enCursoRef = useRef(false)
  const pendienteRef = useRef(false)
  const desmontadoRef = useRef(false)
  const eventosPendientesRef = useRef<EventoRefrescoAdmin[]>([])
  const eventosVistosRef = useRef(new Map<string, number>())
  const sucursalAnteriorRef = useRef(sucursalId)

  useEffect(() => {
    if (sucursalAnteriorRef.current === sucursalId) return

    sucursalAnteriorRef.current = sucursalId
    eventosPendientesRef.current = []
    pendienteRef.current = false

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [sucursalId])

  useEffect(() => {
    desmontadoRef.current = false

    const limpiarTimer = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }

    const programar = (demora: number) => {
      limpiarTimer()
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null
        void ejecutar()
      }, Math.max(0, demora))
    }

    const ejecutar = async () => {
      if (desmontadoRef.current) return

      const opciones = opcionesRef.current

      if (opciones.pausado || enCursoRef.current) {
        pendienteRef.current = true
        return
      }

      enCursoRef.current = true
      pendienteRef.current = false
      const eventos = ordenarEventos(eventosPendientesRef.current)
      eventosPendientesRef.current = []
      const evento = eventos.length > 0 ? eventos[eventos.length - 1] : null

      try {
        await opciones.onRefrescar(evento, eventos)
      } catch (error) {
        console.error('No se pudo refrescar la pantalla:', error)
      } finally {
        enCursoRef.current = false

        if (
          pendienteRef.current &&
          !desmontadoRef.current &&
          !opcionesRef.current.pausado
        ) {
          pendienteRef.current = false
          programar(0)
        }
      }
    }

    programarRef.current = programar

    const alRecibirEvento = (evento: EventoRealtime) => {
      const opciones = opcionesRef.current

      if (evento.tipo === 'reconexion') {
        if (!opciones.revalidarAlReconectar) return
        programar(opciones.debounceMs)
        return
      }

      if (evento.tipo !== 'admin:refresco') return

      const refresco = evento.payload
      if (!opciones.dominios.includes(refresco.dominio)) return

      if (
        opciones.sucursalId !== undefined &&
        opciones.sucursalId !== null &&
        refresco.sucursalId !== opciones.sucursalId
      ) {
        return
      }

      const ahora = Date.now()
      for (const [id, vistoEn] of eventosVistosRef.current) {
        if (ahora - vistoEn > VENTANA_DEDUPLICACION_MS) {
          eventosVistosRef.current.delete(id)
        }
      }

      if (eventosVistosRef.current.has(refresco.eventoId)) return
      eventosVistosRef.current.set(refresco.eventoId, ahora)

      eventosPendientesRef.current.push(refresco)

      if (opciones.pausado) {
        pendienteRef.current = true
        return
      }

      programar(opciones.debounceMs)
    }

    const alCambiarVisibilidad = () => {
      const opciones = opcionesRef.current
      if (
        document.visibilityState !== 'visible' ||
        !opciones.revalidarAlVolverVisible
      ) {
        return
      }

      programar(opciones.debounceMs)
    }

    const desuscribir = suscribir(alRecibirEvento)
    document.addEventListener('visibilitychange', alCambiarVisibilidad)

    return () => {
      desmontadoRef.current = true
      desuscribir()
      document.removeEventListener('visibilitychange', alCambiarVisibilidad)
      limpiarTimer()
      eventosPendientesRef.current = []
      pendienteRef.current = false
      enCursoRef.current = false
    }
  }, [suscribir])

  useEffect(() => {
    if (pausado) {
      if (
        timerRef.current !== null ||
        eventosPendientesRef.current.length > 0
      ) {
        pendienteRef.current = true
      }

      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
      return
    }

    if (!pendienteRef.current) return

    pendienteRef.current = false
    programarRef.current(debounceMs)
  }, [debounceMs, pausado])
}
