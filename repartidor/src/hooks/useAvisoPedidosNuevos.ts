import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'

import { useRealtime } from '../context/realtime/RealtimeContext'
import { useToast, useToasts } from '../context/toasts/ToastContext'
import type { DatosToast } from '../types/toast.types'
import { RUTA_PEDIDOS } from '../components/layout/enlacesNavegacion'

// Junta los pedidos que se liberan casi juntos en un solo aviso
const ESPERA_MS = 1000
const PREFIJO = 'pedidos-nuevos'

interface OpcionesAvisoPedidosNuevos {
  // Sin viaje en curso (sale del contador de la pestaña Pedidos, usePedidosParaTomar):
  // el backend no deja tomar pedidos con un viaje abierto
  puedeTomar: boolean
  // El repartidor de la sesión: no se le avisa del pedido que él mismo quitó (D-21)
  repartidorId: number | null
}

// Plan UX, v1.6 y v1.7: toast (sin campana) cuando hay pedidos nuevos para tomar. Sale del mismo
// refresco que recarga la lista ("pedidos_disponibles" / "creado": el local lo marcó listo o un
// compañero lo quitó de su viaje). Solo lo ve quien puede tomarlo, fuera de Pedidos (donde la
// lista ya se actualiza sola) y nunca por un pedido que quitó él mismo.
export function useAvisoPedidosNuevos({ puedeTomar, repartidorId }: OpcionesAvisoPedidosNuevos) {
  const { suscribir } = useRealtime()
  const { mostrar, cerrar } = useToast()
  const { visibles } = useToasts()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const ruta = useRef(pathname)
  const habilitado = useRef(puedeTomar)
  const yo = useRef(repartidorId)
  // navigate cambia con cada navegación: por referencia, para que la suscripción no se rehaga
  // y una tanda en espera no se pierda si el repartidor cambia de pantalla en ese segundo
  const irA = useRef(navigate)
  const toastActual = useRef<string | null>(null)
  // Pedidos que cuenta el toast que se está viendo: si llegan más, se suman
  const contados = useRef(new Set<number>())

  useEffect(() => {
    ruta.current = pathname
  }, [pathname])

  useEffect(() => {
    habilitado.current = puedeTomar
    yo.current = repartidorId
    irA.current = navigate
  }, [navigate, puedeTomar, repartidorId])

  // Si el toast ya se fue (se cerró o venció), la próxima tanda cuenta de cero
  useEffect(() => {
    if (toastActual.current && !visibles.some((toast) => toast.id === toastActual.current)) {
      toastActual.current = null
      contados.current.clear()
    }
  }, [visibles])

  // Al entrar a Pedidos el aviso ya cumplió su función
  useEffect(() => {
    if (pathname === RUTA_PEDIDOS && toastActual.current) cerrar(toastActual.current)
  }, [cerrar, pathname])

  useEffect(() => {
    let espera: ReturnType<typeof setTimeout> | null = null
    const tanda = new Set<number>()

    const avisar = () => {
      const nuevos = [...tanda]
      tanda.clear()
      if (!habilitado.current || ruta.current === RUTA_PEDIDOS) return

      for (const id of nuevos) contados.current.add(id)
      const pedidos = [...contados.current]

      // Un id nuevo por cantidad: el toast se vuelve a mostrar entero, con su tiempo completo
      const toast: DatosToast = {
        id: `${PREFIJO}-${pedidos.length}-${pedidos.at(-1)}`,
        tono: 'marca',
        icono: ClipboardList,
        titulo: pedidos.length === 1 ? 'Nuevo pedido para tomar' : `Hay ${pedidos.length} pedidos nuevos para tomar`,
        descripcion:
          pedidos.length === 1
            ? `El pedido #${pedidos[0]} está listo para retirar.`
            : 'Ya están listos para retirar en tu sucursal.',
        prioridad: 'normal',
        accion: { texto: 'Ver pedidos', alTocar: () => irA.current(RUTA_PEDIDOS) },
      }

      if (toastActual.current) cerrar(toastActual.current)
      toastActual.current = toast.id
      mostrar(toast)
    }

    const desuscribir = suscribir((evento) => {
      if (evento.tipo !== 'repartidor:refresco') return

      const { dominio, accion, recursos, origenRepartidorId } = evento.payload
      if (dominio !== 'pedidos_disponibles' || accion !== 'creado' || !recursos?.pedidoId) return
      // El pedido que quitó él mismo: su contador sube, pero el aviso es para sus compañeros
      if (origenRepartidorId !== undefined && origenRepartidorId === yo.current) return

      tanda.add(recursos.pedidoId)
      if (espera) clearTimeout(espera)
      espera = setTimeout(() => {
        espera = null
        avisar()
      }, ESPERA_MS)
    })

    return () => {
      if (espera) clearTimeout(espera)
      desuscribir()
    }
  }, [cerrar, mostrar, suscribir])
}
