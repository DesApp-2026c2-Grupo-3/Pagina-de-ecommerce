import type { CSSProperties } from 'react'
import type { ProductIngredient } from '../../types/product'
import { formatearPrecio } from '../../utils/precio'
import CasillaOpcion from './CasillaOpcion'

interface Props {
  ingredientes: ProductIngredient[]
  /** Cantidad final elegida por insumo (solo los que cambiaron respecto de la receta) */
  cantidades: Record<number, number>
  onCambiar: (insumoId: number, cantidad: number) => void
}

// ==========================================
// CONSTANTES DE ESTILO
// ==========================================
const seccionContenedorClase = 'mt-6 grid gap-6 border-t-2 border-dashed border-brand-sand pt-5 sm:grid-cols-2'
const cabeceraGrupoClase = 'mb-2 flex items-baseline justify-between gap-3'
const tituloGrupoClase = 'font-display text-2xl font-extrabold tracking-tight'
const subtituloGrupoClase = 'text-sm font-bold text-brand-muted'

// < 640px: 2 columnas equilibradas dinámicamente usando --filas-sacale
// >= 640px (sm:): vuelve a lista vertical única dentro de su columna
const listaSacaleClase =
  'grid grid-flow-col grid-cols-2 [grid-template-rows:repeat(var(--filas-sacale),minmax(0,1fr))] gap-x-3 sm:flex sm:flex-col [&>*]:min-w-0'
const columnaSumaleConBordeClase = 'sm:border-l-2 sm:border-dashed sm:border-brand-sand sm:pl-6'

function IngredientesEditables({ ingredientes, cantidades, onCambiar }: Props) {
  const removibles = ingredientes.filter((i) => i.esRemovible && i.cantidadBase > 0)
  const agregables = ingredientes.filter((i) => i.esAgregable)
  if (removibles.length === 0 && agregables.length === 0) return null

  const cantidadDe = (i: ProductIngredient) => cantidades[i.insumoId] ?? i.cantidadBase
  const porcion = (i: ProductIngredient) =>
    i.cantidadBase > 0 && !Number.isInteger(i.cantidadBase) ? i.cantidadBase : 1

  // Calcula dinámicamente la mitad de ítems para equilibrar las 2 columnas en móvil
  const filasMovil = Math.max(1, Math.ceil(removibles.length / 2))

  return (
    <section className={seccionContenedorClase}>
      {removibles.length > 0 && (
        <div>
          <div className={cabeceraGrupoClase}>
            <h2 className={tituloGrupoClase}>Sacale</h2>
            <span className={subtituloGrupoClase}>Destildá lo que no va</span>
          </div>

          <div
            className={listaSacaleClase}
            style={{ '--filas-sacale': filasMovil } as CSSProperties}
          >
            {removibles.map((i) => {
              const incluido = cantidadDe(i) > 0
              return (
                <CasillaOpcion
                  key={i.insumoId}
                  texto={i.nombre}
                  marcada={incluido}
                  onCambiar={() => onCambiar(i.insumoId, incluido ? 0 : i.cantidadBase)}
                />
              )
            })}
          </div>
        </div>
      )}

      {agregables.length > 0 && (
        <div className={removibles.length > 0 ? columnaSumaleConBordeClase : ''}>
          <div className={cabeceraGrupoClase}>
            <h2 className={tituloGrupoClase}>Sumale</h2>
            <span className={subtituloGrupoClase}>Opcional</span>
          </div>

          {agregables.map((i) => {
            const sumado = cantidadDe(i) > i.cantidadBase
            const sinStock = i.hayStockExtra === false
            return (
              <CasillaOpcion
                key={i.insumoId}
                texto={i.nombre}
                marcada={sumado}
                deshabilitada={sinStock && !sumado}
                detalle={sinStock ? 'Sin stock' : i.precioComercial > 0 ? `+${formatearPrecio(i.precioComercial)}` : undefined}
                onCambiar={() =>
                  onCambiar(i.insumoId, sumado ? i.cantidadBase : Math.max(cantidadDe(i), i.cantidadBase) + porcion(i))
                }
              />
            )
          })}
        </div>
      )}
    </section>
  )
}

export default IngredientesEditables
