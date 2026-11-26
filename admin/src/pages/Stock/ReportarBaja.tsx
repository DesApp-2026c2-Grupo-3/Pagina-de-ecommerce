import { useEffect, useRef } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import FormularioBaja from '../../components/stock/baja/FormularioBaja'
import EnlaceVolver from '../../components/navegacion/EnlaceVolver'
import { useReportarBaja } from '../../hooks/stock/useReportarBaja'
import { destinoVolverStock } from '../../utils/navegacion/rutasStock'

// «Reportar baja» en página propia, sin modal (plan de Stock, D-S3).
// Ruta: /admin/sucursales/:id/stock/baja, dentro de SoloSuSucursal (RN-35).
export default function ReportarBaja() {
  const { id } = useParams()
  const sucursalId = Number(id)
  const location = useLocation()
  // Vuelve a la vista de Stock de la que vino (Insumos o Movimientos)
  const volverA = destinoVolverStock(location.state, sucursalId)
  const baja = useReportarBaja(sucursalId, volverA)
  const refTitulo = useRef<HTMLHeadingElement | null>(null)

  useEffect(() => {
    const anterior = document.title
    document.title = 'Reportar baja · Admin'
    refTitulo.current?.focus()
    return () => {
      document.title = anterior
    }
  }, [])

  return (
    <main className="@container w-full max-w-full p-4 @3xl:p-8">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <EnlaceVolver to={volverA} texto="Volver a stock" />
        <div>
          <h1 ref={refTitulo} tabIndex={-1} className="text-2xl font-extrabold text-gray-900 outline-none @3xl:text-3xl">
            Reportar baja
          </h1>
          <p className="mt-1 text-gray-600">
            {baja.sucursal ? `${baja.sucursal.nombre} · ` : ''}Queda registrada en el historial, con su motivo.
          </p>
        </div>

        {baja.errorCarga && (
          <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {baja.errorCarga}
          </p>
        )}

        {baja.stock === null ? (
          <p className="text-gray-600">Cargando insumos...</p>
        ) : (
          <FormularioBaja
            stock={baja.stock}
            form={baja.form}
            onCambiar={baja.cambiar}
            error={baja.error}
            enviando={baja.enviando}
            onEnviar={() => void baja.enviar()}
            cancelarA={volverA}
          />
        )}
      </div>
    </main>
  )
}
