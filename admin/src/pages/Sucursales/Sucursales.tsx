import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Pencil, Plus, Power, Package} from 'lucide-react'
import Paginacion from '../../components/Paginacion'
import MensajeVacio from '../../components/MensajeVacio'
import { useToast } from '../../context/ToastContext'
import {
  obtenerSucursales,
  cambiarEstadoSucursal
} from '../../services/sucursales'

export default function Sucursales() {
  const navigate = useNavigate()
  const { mostrarToast } = useToast()

  const [paginaActual, setPaginaActual] = useState(1)
  const sucursalesPorPagina = 5

  const [sucursales, setSucursales] = useState<any[]>([])

  useEffect(() => {
    const cargarSucursales = async () => {
      try {
        const datos = await obtenerSucursales()
        setSucursales(datos)
      } catch (error) {
        console.error('Error al cargar sucursales:', error)
      }
    }

    cargarSucursales()
  }, [])

  const cambiarEstado = async (id: number, activa: boolean) => {
    try {
      const respuesta = await cambiarEstadoSucursal(id, !activa)

      setSucursales(
        sucursales.map((sucursal) =>
          sucursal.id === id
            ? respuesta.sucursal
            : sucursal
        )
      )

      mostrarToast(
        activa
          ? 'Sucursal desactivada'
          : 'Sucursal activada'
      )
    } catch (error) {
      console.error('Error al cambiar estado:', error)
    }
  }

  const indiceUltimaSucursal =
    paginaActual * sucursalesPorPagina

  const indicePrimeraSucursal =
    indiceUltimaSucursal - sucursalesPorPagina

  const sucursalesPagina = sucursales.slice(
    indicePrimeraSucursal,
    indiceUltimaSucursal
  )

  return (
    <main className="p-8">

      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Sucursales
          </h1>

          <p className="text-gray-600 mt-2">
            Gestioná las sucursales disponibles en el sistema.
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/sucursales/nueva')}
          className="bg-action text-white px-4 py-4 rounded-full border
          shadow-[0_0_10px_rgba(249,115,22,0.6)]
          hover:shadow-[0_0_16px_rgba(249,115,22,0.8)]
          transition-all
          border-orange-400
          hover:bg-action-hover w-fit ml-auto"
        >
          <Plus size={22} />
        </button>
      </div>

      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="min-w-max w-full border-collapse">

          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-6 py-3">
                Nombre
              </th>

              <th className="text-left px-6 py-3">
                Dirección
              </th>

              <th className="text-left px-6 py-3">
                Localidad
              </th>

              <th className="text-left px-6 py-3">
                Teléfono
              </th>

              <th className="text-left px-6 py-3">
                Horario
              </th>

              <th className="text-left px-6 py-3">
                Radio de entrega
              </th>

              <th className="text-left px-6 py-3">
                Estado
              </th>

              <th className="text-right px-6 py-3">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            {sucursalesPagina.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-10">
                  <MensajeVacio mensaje="No hay sucursales registradas." />
                </td>
              </tr>
            ) : (
              sucursalesPagina.map((sucursal: any) => (
                <tr
                  key={sucursal.id}
                  className="border-t border-b"
                >
                  <td className="px-6 py-4">
                    {sucursal.nombre}
                  </td>

                  <td className="px-6 py-4">
                    {sucursal.calle} {sucursal.numero}
                  </td>

                  <td className="px-6 py-4">
                    {sucursal.localidad}, {sucursal.provincia}
                  </td>

                  <td className="px-6 py-4">
                    {sucursal.telefono || 'Sin teléfono'}
                  </td>

                  <td className="px-6 py-4">
                    {sucursal.horario || 'Sin horario'}
                  </td>

                  <td className="px-6 py-4">
                    {sucursal.radioEntregaKm} km
                  </td>

                  <td className="px-6 py-4">
                    {sucursal.activa
                      ? 'Activa'
                      : 'Inactiva'}
                  </td>

                  <td className="flex justify-end gap-2 px-6 py-4">

                    <button
                      onClick={() =>
                        navigate(
                          `/admin/sucursales/editar/${sucursal.id}`
                        )
                      }
                      className="bg-emerald-200 text-success hover:text-success-hover p-2 border rounded
                      hover:drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                    >
                      <Pencil size={18} />
                    </button>

                    <button onClick={() =>
                    navigate(`/admin/sucursales/${sucursal.id}/stock`)}
                    className="bg-blue-200 text-blue-700 hover:text-blue-900 p-2 border rounded 
                    hover:drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                      <Package size={18} />
                    </button>

                    <button
                      onClick={() =>
                        cambiarEstado(
                          sucursal.id,
                          sucursal.activa
                        )
                      }
                      className="bg-slate-200 text-secondary hover:text-secondary-hover p-2 border rounded
                      hover:drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                    >
                      <Power size={18} />
                    </button>

                  </td>
                </tr>
              ))
            )}
          </tbody>

        </table>
      </div>

      <Paginacion
        paginaActual={paginaActual}
        totalElementos={sucursales.length}
        elementosPorPagina={sucursalesPorPagina}
        cambiarPagina={setPaginaActual}
      />

    </main>
  )
}