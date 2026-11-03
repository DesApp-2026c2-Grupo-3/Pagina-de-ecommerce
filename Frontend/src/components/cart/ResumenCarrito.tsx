import { ArrowRight } from 'lucide-react'
import { COSTO_ENVIO } from '../../config/compra'
import { formatearPrecio } from '../../utils/precio'
import { useCart } from '../../context/CartContext'
//import CampoCupon from './CampoCupon'
import { ChevronDown } from 'lucide-react'

// Asumiendo que COSTO_ENVIO y formatearPrecio vienen de tus constantes/helpers externos

interface Props {
  cantidad: number
  subtotal: number
  logueado: boolean
  deshabilitado?: boolean
  motivo?: string | null
  onConfirmar: () => void
}

function ResumenCarrito({ cantidad, subtotal, logueado, deshabilitado = false, motivo, onConfirmar }: Props) {
  const { items } = useCart()
  const total = subtotal + (COSTO_ENVIO ?? 0)

  // Función para recortar el nombre
  const abreviarNombre = (nombre: string, limite = 16) => {
    if (!nombre) return ""
    if (nombre.length <= limite) return nombre
    return `${nombre.substring(0, limite)}...`
  }

  // Helper para saber si tiene cambios respecto al base limpio
  const esCombinacionModificada = (item: any) => {
    if (item.personalizaciones && item.personalizaciones.length > 0) return true
    if (item.combo && item.combo.length > 0) return true
    return item.id.includes('|') || item.id.includes('-c')
  }

  // Diccionario para contar cuántas variantes modificadas van apareciendo por cada producto base
  const conteoVariantesPorProducto: Record<number, number> = {}

  // Primero contamos cuántas variantes totales modificadas de cada producto hay en el carrito
  const totalesModificadosPorProducto = items?.reduce((acc: Record<number, number>, item) => {
    if (esCombinacionModificada(item)) {
      acc[item.product.id] = (acc[item.product.id] || 0) + 1
    }
    return acc
  }, {}) || {}

  return (
    <aside className="flex flex-col gap-4 rounded-[2rem] border-2 border-brand-dark bg-white p-6 shadow-sticker">
      <h2 className="font-display text-2xl font-extrabold">Resumen</h2>

      {/* 1. Lista detallada colapsable */}
      <div className="flex flex-col gap-2 text-brand-muted">
        <details className="group [&_summary::-webkit-details-marker]:hidden w-full">
          
          {/* Botón que controla el abrir/cerrar */}
          <summary className="flex items-center justify-between font-medium cursor-pointer list-none py-1 hover:text-brand-dark transition-colors">
            <span className="text-sm">Ver Detalles</span>
            <ChevronDown className="w-4 h-4 text-brand-muted transition-transform duration-200 group-open:rotate-180" />
          </summary>

          {/* Contenido oculto que se despliega */}
          <ul className="flex flex-col gap-1.5 text-sm pl-1 mt-2 border-t border-dashed border-brand-sand/40 pt-2">
            {items?.map((item) => {
              const tieneMultiples = item.quantity > 1
              const subtotalItem = item.unitPrice * item.quantity
              const esModificado = esCombinacionModificada(item)
              const tamanio = item.tamanio || undefined

              // Reglas de negocio para el salto de línea (Combo, Bebida o Papa Frita)
              const esCombo = !!item.combo
              //const esBebida = item.product.categoria === 'bebida' || item.product.esBebida
              const nombreMinuscula = item.product.nombre?.toLowerCase() || ""
              const esPapaFrita = nombreMinuscula.includes("papa") || nombreMinuscula.includes("frita")

              const requiereDiseñoDetallado = esCombo || tamanio || esPapaFrita

              let sufijoNumeral = ""

              if (esModificado && totalesModificadosPorProducto[item.product.id] > 1) {
                conteoVariantesPorProducto[item.product.id] = (conteoVariantesPorProducto[item.product.id] || 0) + 1
                sufijoNumeral = ` #${conteoVariantesPorProducto[item.product.id]}`
              }

              return (
                <li key={item.id} className="flex justify-between items-center gap-2 py-1">

                  {/* Contenedor de textos dinámico */}
                  <div className={`truncate flex ${requiereDiseñoDetallado ? 'flex-col items-start' : 'items-center flex-wrap gap-1'}`}>

                    {/* Nombre del producto */}
                    <span className="font-medium truncate text-brand-dark">
                      {abreviarNombre(item.product.nombre)}
                    </span>

                    {/* Detalles (caen abajo si requiereDiseñoDetallado es true) */}
                    <div className={`flex items-center gap-1 ${requiereDiseñoDetallado ? 'text-xs text-gray-500 mt-0.5' : ''}`}>
                      {tamanio && (
                        <span className="capitalize font-medium">
                          {!esCombo && !esPapaFrita && tamanio == "mediano" ? "Mediana" : tamanio}
                        </span>
                      )}

                      {esModificado && (
                        <span className="text-[11px] text-brand-red font-bold">
                          (Modificado{sufijoNumeral})
                        </span>
                      )}

                      {tieneMultiples && (
                        <span className="text-xs italic opacity-80">
                          ({item.quantity} items)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Precio a la derecha siempre alineado en su eje */}
                  <span className="font-medium shrink-0 text-brand-dark self-center">
                    {formatearPrecio(subtotalItem)}
                  </span>
                </li>
              )
            })}
          </ul>
        </details>
      </div>
          
      {/* 2. Bloque de Cantidad Total y Subtotal */}
      <div className="flex flex-col gap-2 border-t-2 border-dashed border-brand-sand pt-4 text-brand-muted">
        <div className="flex justify-between text-sm">
          <span className="font-bold">
            {cantidad} {cantidad === 1 ? 'producto' : 'productos'}
          </span>
          {/* El total de items / subtotal de abajo en negrita utilizando tus clases de diseño */}
          <span className="font-extrabold text-brand-dark">{formatearPrecio(subtotal)}</span>
        </div>
      </div>

      {/* Total Principal Grande */}
      <div className="flex items-baseline justify-between border-t-2 border-dashed border-brand-sand pt-2">
        <span className="font-extrabold">Total</span>
        <span className="font-display text-4xl font-extrabold">{formatearPrecio(total)}</span>
      </div>

      <button
        type="button"
        onClick={onConfirmar}
        disabled={deshabilitado}
        className="flex min-h-13 items-center justify-center gap-2 rounded-full bg-brand-red px-6 font-bold text-white transition-transform hover:translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {logueado ? 'Continuar' : 'Iniciá sesión para continuar'}
        <ArrowRight className="h-5 w-5" />
      </button>

      {deshabilitado && (
        <p className="text-center text-sm font-semibold text-brand-red">
          {motivo ?? 'La sucursal está cerrada. No se pueden generar pedidos ahora.'}
        </p>
      )}
    </aside>
  )
}

export default ResumenCarrito