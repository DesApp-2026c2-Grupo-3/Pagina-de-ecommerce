import { useCallback, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import { useNotificaciones } from '../../context/notificaciones/NotificacionContext'
import { useEstadoConexion } from '../../hooks/useEstadoConexion'
import { useTituloNoLeidas } from '../../hooks/useTituloNoLeidas'
import { useAvisosEnVivo } from '../../hooks/useAvisosEnVivo'
import { useAvisoPedidosNuevos } from '../../hooks/useAvisoPedidosNuevos'
import { usePedidosParaTomar } from '../../hooks/usePedidosParaTomar'
import EncabezadoApp from './EncabezadoApp'
import NavegacionSuperior from './NavegacionSuperior'
import NavegacionInferior from './NavegacionInferior'
import FranjaConexion from '../conexion/FranjaConexion'
import ContenedorToasts from '../toasts/ContenedorToasts'

// Solo compone: encabezado (con la franja de conexión y la campana), navegación, contenido y toasts
export default function MainLayout() {
  const { repartidor, cerrarSesion } = useAuth()
  const { estado, franja } = useEstadoConexion()
  const { noLeidas } = useNotificaciones()
  const navigate = useNavigate()
  const [avisosAbiertos, setAvisosAbiertos] = useState(false)

  const alternarAvisos = useCallback(() => setAvisosAbiertos((abiertos) => !abiertos), [])
  const abrirAvisos = useCallback(() => setAvisosAbiertos(true), [])
  const cerrarAvisos = useCallback(() => setAvisosAbiertos(false), [])

  useTituloNoLeidas(noLeidas)
  // Tocar la acción de un toast lleva a otra pantalla: si la bandeja estaba abierta, se cierra
  useAvisosEnVivo(cerrarAvisos)
  // Pedidos para tomar (v1.7): contador en la pestaña Pedidos y toast agrupado, sin campana
  const pedidosParaTomar = usePedidosParaTomar()
  useAvisoPedidosNuevos({ puedeTomar: pedidosParaTomar !== null, repartidorId: repartidor?.id ?? null })

  // Sin cookie no hay nada que cerrar en el servidor: el cierre es local
  const manejarSalir = () => {
    cerrarSesion()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-orange-50/60">
      <header className="sticky top-0 z-30 border-b border-orange-100 bg-white/95 shadow-sm backdrop-blur-md">
        <EncabezadoApp
          repartidor={repartidor}
          conexion={estado}
          noLeidas={noLeidas}
          avisosAbiertos={avisosAbiertos}
          onAlternarAvisos={alternarAvisos}
          onCerrarAvisos={cerrarAvisos}
          onSalir={manejarSalir}
        />
        <FranjaConexion franja={franja} />
      </header>

      <NavegacionSuperior pedidosParaTomar={pedidosParaTomar} />

      {/* Abajo deja lugar a la barra inferior del celular */}
      <main className="mx-auto max-w-7xl px-4 pt-6 pb-[calc(var(--alto-nav-inferior)+1.5rem)] sm:px-6 sm:pt-8 md:pb-8">
        <Outlet />
      </main>

      <NavegacionInferior
        noLeidas={noLeidas}
        pedidosParaTomar={pedidosParaTomar}
        avisosAbiertos={avisosAbiertos}
        onAbrirAvisos={abrirAvisos}
      />

      <ContenedorToasts />
    </div>
  )
}
