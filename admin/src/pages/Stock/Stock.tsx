import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import MensajeVacio from '../../components/MensajeVacio'
import { obtenerSucursalPorId } from '../../services/sucursales'
import { obtenerStockPorSucursal } from '../../services/stock'
import { useToast } from '../../context/ToastContext'
import { cargarAumento } from '../../services/stock'

export default function StockSucursal() {
  const { id } = useParams()

  const [sucursal, setSucursal] = useState<any>(null)
  const [stock, setStock] = useState<any[]>([])

  const { mostrarToast } = useToast()

  const [stockSeleccionado, setStockSeleccionado] = useState<any>(null)
  
  const [cantidad, setCantidad] = useState('')

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const sucursalId = Number(id)

        const [datosSucursal, datosStock] = await Promise.all([
          obtenerSucursalPorId(sucursalId),
          obtenerStockPorSucursal(sucursalId)
        ])

        setSucursal(datosSucursal)
        setStock(datosStock)

      } catch (error) {
        console.error('Error al cargar stock:', error)
      }
    }

    cargarDatos()
  }, [id])

  return (
    <main className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          Stock
        </h1>

        <p className="text-gray-600 mt-2">
          {sucursal
            ? `Stock de la sucursal ${sucursal.nombre}.`
            : 'Cargando sucursal...'}
        </p>
      </div>

      <div className="bg-white border rounded-lg overflow-x-auto">

        <table className="min-w-max w-full border-collapse">

          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-6 py-3">
                Insumo
              </th>

              <th className="text-left px-6 py-3">
                Unidad
              </th>

              <th className="text-left px-6 py-3">
                Cantidad
              </th>

              <th className="text-left px-6 py-3">
                Stock mínimo
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

            {stock.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10">
                  <MensajeVacio mensaje="No hay stock registrado para esta sucursal." />
                </td>
              </tr>
            ) : (

              stock.map((item: any) => (
                <tr
                  key={item.id}
                  className="border-t border-b"
                >

                  <td className="px-6 py-4">
                    {item.nombre}
                  </td>

                  <td className="px-6 py-4">
                    {item.unidadMedida}
                  </td>

                  <td className="px-6 py-4">
                    {item.cantidad}
                  </td>

                  <td className="px-6 py-4">
                    {item.stockMinimo ?? 'Sin definir'}
                  </td>

                  <td className="px-6 py-4">
                    <span className={ item.bajoMinimo 
                    ? 'rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700'
                    : 'rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700'}>
                        {item.bajoMinimo ? 'Bajo' : 'Normal'}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                    onClick={() => {console.log('Cargar stock:', item)
                        setStockSeleccionado(item); setCantidad('')}}
                      className="bg-action text-white px-3 py-2 rounded
                      hover:bg-action-hover border border-black"
                    >
                      Cargar
                    </button>
                  </td>

                </tr>
              ))

            )}

          </tbody>

        </table>

        {stockSeleccionado && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 
            text-center">
                <div className="w-full max-w-md rounded-lg bg-stone-300 p-6 shadow-xl
                border-2 border-black">

                    <h2 className="text-xl font-bold mb-4">
                        Cargar stock
                    </h2>

                    <p className="mb-4">
                        {stockSeleccionado.nombre}
                    </p>

                    <p className="text-gray-600 mb-4">
                        Stock actual: {stockSeleccionado.cantidad}{' '}
                        {stockSeleccionado.unidadMedida}
                    </p>

                    <div className="grid gap-3 justify-center ">

                        <div>
                            <label className="block font-medium mb-2">
                                Cantidad a agregar
                            </label>

                            <input
                            type="number"
                            min="1"
                            value={cantidad}
                            onChange={(e) => setCantidad(e.target.value)}
                            className="border rounded px-3 py-2"
                            />
                        </div>

                        <div className='flex gap-4'>

                        <button onClick={async () => {
                            const cantidadNumerica = Number(cantidad)

                            if (cantidadNumerica <= 0) {
                                mostrarToast('Ingresá una cantidad válida')
                                return
                            }

                            try {
                                await cargarAumento(
                                stockSeleccionado.id,
                                cantidadNumerica
                            )

                            const datosActualizados =
                            await obtenerStockPorSucursal(Number(id))

                            setStock(datosActualizados)

                            setStockSeleccionado(null)
                            setCantidad('')

                            mostrarToast('Stock actualizado!')
                            } catch (error) {
                                mostrarToast(
                                    error instanceof Error
                                    ? error.message
                                    : 'Error al cargar stock'
                                )
                            }
                        }}
                        className="bg-action text-white px-4 py-2 rounded
                        hover:bg-action-hover border border-black">
                            Confirmar
                        </button>

                        <button onClick={() => {
                            setStockSeleccionado(null)
                            setCantidad('')
                        }}
                        className="bg-secondary text-white px-4 py-2 rounded
                        hover:bg-secondary-hover border border-black"
                        >
                            Cancelar
                        </button>
                        </div>
                    </div>

                </div>
            </div>
        )}

      </div>

    </main>
  )
}