import { useEffect, useState } from 'react'
import { History, Package, CheckCircle, XCircle } from 'lucide-react'
import { obtenerHistorialViajes } from '../../services/viajeService'
import type { ViajeHistorial } from '../../types/viaje.types'

export default function Historial() {
  const [viajes, setViajes] = useState<ViajeHistorial[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        setCargando(true)
        setError('')

        const datos = await obtenerHistorialViajes()
        setViajes(datos)
      } catch {
        setError('No se pudo cargar el historial de viajes.')
      } finally {
        setCargando(false)
      }
    }

    cargarHistorial()
  }, [])

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-AR', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  }

  if (cargando) {
    return <p className="text-slate-500">Cargando historial...</p>
  }

  if (error) {
    return <p className="text-red-600">{error}</p>
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-slate-900">
          Historial de viajes
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Consultá tus recorridos y entregas anteriores.
        </p>
      </section>

      {viajes.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <History className="mx-auto text-slate-400" size={40} />
          <h3 className="mt-4 font-semibold text-slate-800">
            Todavía no tenés viajes finalizados
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Cuando completes tu primer viaje, aparecerá acá.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {viajes.map((viaje) => {
            const entregados = viaje.Pedidos.filter(
              pedido => pedido.estado === 'Entregado'
            ).length

            const cancelados = viaje.Pedidos.filter(
              pedido => pedido.estado === 'Cancelado'
            ).length

            return (
              <article
                key={viaje.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-slate-900">
                    Viaje #{viaje.id}
                  </h3>

                  <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
                    Finalizado
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <p>
                    <span className="font-medium text-slate-800">
                      Inicio:
                    </span>{' '}
                    {formatearFecha(viaje.fechaInicio)}
                  </p>

                  <p>
                    <span className="font-medium text-slate-800">
                      Finalización:
                    </span>{' '}
                    {viaje.fechaFin
                      ? formatearFecha(viaje.fechaFin)
                      : 'No disponible'}
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
                  <div>
                    <Package size={20} className="text-slate-500" />
                    <p className="mt-2 text-xl font-bold text-slate-900">
                      {viaje.Pedidos.length}
                    </p>
                    <p className="text-xs text-slate-500">Pedidos</p>
                  </div>

                  <div>
                    <CheckCircle size={20} className="text-green-600" />
                    <p className="mt-2 text-xl font-bold text-slate-900">
                      {entregados}
                    </p>
                    <p className="text-xs text-slate-500">Entregados</p>
                  </div>

                  <div>
                    <XCircle size={20} className="text-red-500" />
                    <p className="mt-2 text-xl font-bold text-slate-900">
                      {cancelados}
                    </p>
                    <p className="text-xs text-slate-500">Cancelados</p>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}