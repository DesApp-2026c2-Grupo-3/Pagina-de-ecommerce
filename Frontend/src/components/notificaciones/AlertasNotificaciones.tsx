import { useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useRealtime } from '../../context/realtime/RealtimeContext'
import { useToast } from '../../context/ToastContext'
import { useZona } from '../../context/ZonaContext'
import { mapearNotificacion } from '../../utils/notificaciones/mapearNotificacion'

function AlertasNotificaciones() {
  const { user } = useAuth()
  const { suscribir } = useRealtime()
  const { showToast } = useToast()
  const {
    zona,
    abrirSelector,
    marcarSucursalCerrada,
    refrescarSucursales,
  } = useZona()
  const mostradasRef = useRef(new Set<number>())
  const sucursalId = zona?.sucursalId ?? null

  useEffect(() => {
    if (!user || sucursalId === null) return

    return suscribir((evento) => {
      if (evento.tipo !== 'notificacion') return

      const notificacion = mapearNotificacion(evento.payload)
      if (!notificacion || notificacion.tipo !== 'sucursal.cerrada') return
      if (notificacion.datos.sucursalId !== sucursalId) return
      if (mostradasRef.current.has(notificacion.id)) return

      mostradasRef.current.add(notificacion.id)
      if (mostradasRef.current.size > 50) {
        const primera = mostradasRef.current.values().next().value
        if (primera !== undefined) mostradasRef.current.delete(primera)
      }

      marcarSucursalCerrada(sucursalId)
      refrescarSucursales()
      showToast(
        `${notificacion.datos.sucursalNombre} cerró. No se pueden confirmar pedidos por ahora.`,
        {
          variante: 'alerta',
          accion: {
            label: 'Cambiar zona',
            onClick: abrirSelector,
          },
        },
      )
    })
  }, [
    abrirSelector,
    marcarSucursalCerrada,
    refrescarSucursales,
    showToast,
    sucursalId,
    suscribir,
    user,
  ])

  return null
}

export default AlertasNotificaciones
