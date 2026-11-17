import { useEffect, useState } from 'react'
import { ArrowUp, History, Search } from 'lucide-react'

import { obtenerHistorialViajes } from '../../services/viajeService'
import type { ViajeHistorial } from '../../types/viaje.types'

import FiltrosHistorial from '../../components/historial/FiltrosHistorial'
import TarjetaViajeHistorial from '../../components/historial/TarjetaViajeHistorial'

import { filtrarViajes } from '../../utils/historial.utils'

export default function Historial() {
  const [viajes, setViajes] = useState<ViajeHistorial[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  const [mostrarVolverArriba, setMostrarVolverArriba] = useState(false)

  useEffect(() => {
    const controlarScroll = () => {
      setMostrarVolverArriba(window.scrollY > 400)
    }

    window.addEventListener('scroll', controlarScroll)

    return () => {
      window.removeEventListener('scroll', controlarScroll)
    }
  }, [])

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

  const viajesFiltrados = filtrarViajes(
    viajes,
    filtroEstado,
    busqueda,
    fechaDesde,
    fechaHasta
  )

  if (cargando) {
    return <p className="text-slate-500">Cargando historial...</p>
  }

  if (error) {
    return <p className="text-red-600">{error}</p>
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <section>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-orange-100 p-3">
            <History className="text-orange-600" size={25} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Historial de viajes
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Consultá tus recorridos y entregas anteriores.
            </p>
          </div>
        </div>
      </section>

      {viajes.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <History className="mx-auto text-slate-400" size={40} />

          <h3 className="mt-4 font-semibold text-slate-800">
            Todavía no tenés viajes registrados
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Cuando completes o canceles un viaje, aparecerá acá.
          </p>
        </div>
      ) : (
        <>
          {/* Filtros */}
          <FiltrosHistorial
            filtroEstado={filtroEstado}
            busqueda={busqueda}
            fechaDesde={fechaDesde}
            fechaHasta={fechaHasta}
            setFiltroEstado={setFiltroEstado}
            setBusqueda={setBusqueda}
            setFechaDesde={setFechaDesde}
            setFechaHasta={setFechaHasta}
          />

          {/* Resultados */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Mostrando{' '}
              <span className="font-bold text-slate-900">
                {viajesFiltrados.length}
              </span>{' '}
              de {viajes.length} viajes
            </p>
          </div>

          {viajesFiltrados.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <Search className="mx-auto text-slate-400" size={35} />

              <h3 className="mt-3 font-semibold text-slate-800">
                No se encontraron viajes
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Probá modificando los filtros o limpiándolos.
              </p>
            </div>
          ) : (
            <div className="grid gap-5">
              {viajesFiltrados.map((viaje) => (
                <TarjetaViajeHistorial
                  key={viaje.id}
                  viaje={viaje}
                />
              ))}
            </div>
          )}
        </>
      )}

      {mostrarVolverArriba && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-orange-600 text-white shadow-lg shadow-orange-500/30 transition-all duration-200 hover:-translate-y-1 hover:bg-orange-700 hover:shadow-xl"
        aria-label="Volver arriba" title="Volver arriba">
          <ArrowUp size={22} />
        </button>
      )}
    </div>
  )
}