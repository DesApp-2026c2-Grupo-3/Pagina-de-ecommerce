import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { marcarNotificacionLeida, marcarTodasLeidas, obtenerNotificaciones } from '../services/notificacionService'
import type { Notificacion, RespuestaNotificaciones } from '../types/notificacion.types'
import { haceCuanto } from '../utils/tiempo'

const CADA_MS = 30000

// A dónde lleva cada aviso según quién lo recibe
function destinoDe(n: Notificacion, rol?: string) {
  if (n.parteId) return `/admin/partes?parte=${n.parteId}`
  if (n.tipo === 'CIERRE' || n.tipo === 'REAPERTURA') {
    if (rol === 'ADMIN') return '/admin/mi-sucursal'
    if (rol === 'MASTER') return '/admin/sucursales'
    return '/admin/pedidos'
  }
  return '/admin'
}

// Campanita con el globo de no leídas. Consulta cada 30 s mientras la pestaña está visible.
export default function Campanita() {
  const navigate = useNavigate()
  const { administrador } = useAuth()
  const [abierta, setAbierta] = useState(false)
  const [datos, setDatos] = useState<RespuestaNotificaciones>({ noLeidas: 0, items: [] })
  const contenedor = useRef<HTMLDivElement>(null)

  const cargar = useCallback(async () => {
    try {
      setDatos(await obtenerNotificaciones())
    } catch {
      // Sin conexión o sesión vencida: se reintenta en la próxima consulta
    }
  }, [])

  useEffect(() => {
    void cargar()
    const siEstaVisible = () => {
      if (document.visibilityState === 'visible') void cargar()
    }
    const intervalo = window.setInterval(siEstaVisible, CADA_MS)
    document.addEventListener('visibilitychange', siEstaVisible)
    return () => {
      window.clearInterval(intervalo)
      document.removeEventListener('visibilitychange', siEstaVisible)
    }
  }, [cargar])

  useEffect(() => {
    if (!abierta) return
    const fuera = (e: MouseEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setAbierta(false)
    }
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierta(false)
    }
    document.addEventListener('mousedown', fuera)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('mousedown', fuera)
      document.removeEventListener('keydown', escape)
    }
  }, [abierta])

  const abrir = async (n: Notificacion) => {
    setAbierta(false)
    if (!n.leida) {
      try {
        await marcarNotificacionLeida(n.id)
      } catch {
        // Si falla, igual se lleva a la persona al parte
      }
      void cargar()
    }
    navigate(destinoDe(n, administrador?.rol))
  }

  const leerTodas = async () => {
    try {
      await marcarTodasLeidas()
    } catch {
      // Se reintenta con el próximo clic
    }
    void cargar()
  }

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        onClick={() => setAbierta(!abierta)}
        aria-label={datos.noLeidas > 0 ? `Notificaciones: ${datos.noLeidas} sin leer` : 'Notificaciones'}
        aria-haspopup="menu"
        aria-expanded={abierta}
        className="relative rounded-full border bg-white p-2 text-gray-700 hover:bg-gray-100"
      >
        <Bell size={20} />
        {datos.noLeidas > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
            {datos.noLeidas > 9 ? '9+' : datos.noLeidas}
          </span>
        )}
      </button>

      {abierta && (
        <div role="menu" className="absolute right-0 top-full z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border bg-white shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="font-semibold">Notificaciones</p>
            {datos.noLeidas > 0 && (
              <button type="button" onClick={leerTodas} className="text-sm text-orange-600 underline">
                Marcar todas como leídas
              </button>
            )}
          </div>

          {datos.items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-500">No tenés notificaciones.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {datos.items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => abrir(n)}
                    className={`flex w-full items-start gap-3 border-b px-4 py-3 text-left last:border-b-0 hover:bg-gray-50 ${
                      n.leida ? '' : 'bg-orange-50'
                    }`}
                  >
                    <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.leida ? 'bg-transparent' : 'bg-red-600'}`} />
                    <span className="min-w-0">
                      <span className="block font-medium">{n.titulo}</span>
                      <span className="block break-words text-sm text-gray-600">{n.mensaje}</span>
                      <span className="block text-xs text-gray-500">{haceCuanto(n.creada)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
