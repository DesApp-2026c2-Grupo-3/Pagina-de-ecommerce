import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getCalificacionPendiente } from '../../services/calificacionService'
import CalificarPedidoModal from './CalificarPedidoModal'
import type { CalificacionPendiente as Pendiente } from '../../types/calificacion'

// Espera un momento antes de preguntar, para no pisar la bienvenida ni la elección de zona
const RETRASO_MS = 3000

// Pantallas donde nunca se interrumpe al cliente (está comprando o entrando a su cuenta)
const RUTAS_SIN_MODAL = ['/carrito', '/checkout', '/login', '/registro', '/recuperar-password', '/restablecer-password']

const claveDescartada = (pedidoId: number) => `calificacionDescartada:${pedidoId}`

const fueDescartada = (pedidoId: number) => {
  try {
    return localStorage.getItem(claveDescartada(pedidoId)) === '1'
  } catch {
    return false
  }
}

// Al iniciar sesión o abrir la página: si el último pedido está para calificar, lo ofrece en un modal cerrable.
// Si el cliente lo cierra no vuelve a saltar por ese pedido (cuando existan las notificaciones, quedará allí pendiente).
interface CalificacionPendienteProps {
  /** Cuánto espera antes de preguntar (los tests lo ponen en 0) */
  retrasoMs?: number
}

export default function CalificacionPendiente({ retrasoMs = RETRASO_MS }: CalificacionPendienteProps) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [pendiente, setPendiente] = useState<Pendiente | null>(null)
  const usuarioId = user?.id

  useEffect(() => {
    setPendiente(null)
    if (usuarioId === undefined) return

    let cancelado = false
    const temporizador = setTimeout(() => {
      getCalificacionPendiente(usuarioId)
        .then((resultado) => {
          if (!cancelado && resultado && !fueDescartada(resultado.pedidoId)) setPendiente(resultado)
        })
        .catch(() => {
          // Calificar es opcional: si falla, no se molesta al cliente
        })
    }, retrasoMs)

    return () => {
      cancelado = true
      clearTimeout(temporizador)
    }
  }, [usuarioId, retrasoMs])

  if (!user || !pendiente || RUTAS_SIN_MODAL.includes(pathname)) return null

  function descartar() {
    try {
      localStorage.setItem(claveDescartada(pendiente!.pedidoId), '1')
    } catch {
      // Sin almacenamiento: puede volver a aparecer en la próxima visita
    }
    setPendiente(null)
  }

  return (
    <CalificarPedidoModal
      pendiente={pendiente}
      usuarioId={user.id}
      onDescartar={descartar}
      onTerminar={() => setPendiente(null)}
    />
  )
}
