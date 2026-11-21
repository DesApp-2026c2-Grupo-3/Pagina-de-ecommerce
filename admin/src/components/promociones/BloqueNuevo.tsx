// Bloque 3: "Nuevo en la carta" de la página de Promos (un producto presentado como lanzamiento)
import { useState } from 'react'
import type { ProductoOpcion } from '../../utils/mecanicasPromo'
import { guardarProductoNuevo } from '../../services/promocionService'
import { Acciones, ErrorCampo, ErrorGeneral, SelectProducto, TarjetaBloque, ayuda, botonSecundario, etiqueta, formatearPrecio } from './comun'

interface Props {
  productoId: number | null
  productos: ProductoOpcion[]
  abierta: boolean
  onAbrir: () => void
  onCerrar: () => void
  onGuardado: (mensaje: string) => void
}

export default function BloqueNuevo({ productoId, productos, abierta, onAbrir, onCerrar, onGuardado }: Props) {
  const [elegido, setElegido] = useState<number | null>(null)
  const [errorCampo, setErrorCampo] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const actual = productos.find((p) => p.id === productoId)

  function abrir() {
    setElegido(productoId)
    setErrorCampo('')
    setError('')
    onAbrir()
  }

  async function guardar(id: number | null, mensaje: string) {
    setGuardando(true)
    setError('')
    try {
      await guardarProductoNuevo(id)
      onGuardado(mensaje)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el producto nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  const resumen = actual ? (
    <>
      <span className="font-semibold">{actual.nombre}</span> · desde {formatearPrecio(actual.precio)}
    </>
  ) : (
    <span className="text-gray-600">No hay producto nuevo: el bloque no se muestra.</span>
  )

  return (
    <TarjetaBloque numero={3} lugar="Bloque «Nuevo»" titulo="Nuevo en la carta" resumen={resumen} abierta={abierta} onAbrir={abrir} tono="neutro">
      <div className="flex max-w-lg flex-col gap-4 rounded-lg border bg-white p-4">
        <div>
          <label htmlFor="nuevo-producto" className={etiqueta}>Producto que se presenta como nuevo</label>
          <SelectProducto id="nuevo-producto" productos={productos} valor={elegido} onChange={(id) => { setElegido(id); setErrorCampo('') }} />
          <p className={ayuda}>Se muestra con su foto, descripción y precio. No lleva descuento.</p>
          <ErrorCampo mensaje={errorCampo} />
        </div>
        <ErrorGeneral mensaje={error} />
        <Acciones
          guardando={guardando}
          onCancelar={onCerrar}
          onGuardar={() => (elegido == null ? setErrorCampo('Elegí un producto') : guardar(elegido, 'Producto nuevo actualizado'))}
          extra={productoId != null && (
            <button type="button" onClick={() => guardar(null, 'Se sacó el bloque «Nuevo en la carta»')} disabled={guardando} className={botonSecundario}>
              Sacar de la página
            </button>
          )}
        />
      </div>
    </TarjetaBloque>
  )
}
