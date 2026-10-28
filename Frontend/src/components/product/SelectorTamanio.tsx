import { useEffect, useState } from 'react'
import { etiquetaTamanio } from '../../config/combo'
import { formatearPrecio } from '../../utils/precio'
import type { ProductoTamanio } from '../../types/product'
import CategoryIcon from '../icons/CategoryIcon'
import SeccionOpciones from './SeccionOpciones'

interface SelectorTamanioProps {
  tamanios: ProductoTamanio[]
  valor: number | null
  onChange: (tamanioId: number) => void
  /** Combos: una opción por fila, con la imagen del tamaño a la izquierda (se ve bien en el celular) */
  conImagen?: boolean
}

// Tamaño del ícono de reemplazo, para que se note la diferencia entre regular, mediano y grande
const ICONO_POR_POSICION = ['h-6 w-6', 'h-8 w-8', 'h-10 w-10']

// Imagen del tamaño (/imagenes/Formatos/...). Mientras el archivo no exista, muestra un vaso del tamaño que corresponde.
function ImagenFormato({ src, posicion }: { src?: string | null; posicion: number }) {
  const [rota, setRota] = useState(false)
  useEffect(() => setRota(false), [src])

  return (
    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-sand">
      {src && !rota ? (
        <img src={src} alt="" onError={() => setRota(true)} className="h-12 w-12 object-contain" />
      ) : (
        <CategoryIcon icono="bebida" className={ICONO_POR_POSICION[Math.min(posicion, 2)]} />
      )}
    </span>
  )
}

// Pastillas de tamaño. El primero es la base; los demás muestran cuánto suman ("+$400").
// En los combos, una fila por tamaño con su imagen.
function SelectorTamanio({ tamanios, valor, onChange, conImagen = false }: SelectorTamanioProps) {
  if (tamanios.length === 0) return null
  const base = Number(tamanios[0].precio)

  return (
    <SeccionOpciones titulo="Tamaño" etiqueta="Elegí 1">
      <div role="radiogroup" aria-label="Tamaño" className={conImagen ? 'flex flex-col gap-2' : 'flex flex-wrap gap-2'}>
        {tamanios.map((t, posicion) => {
          const activo = t.tamanioId === valor
          const diferencia = Number(t.precio) - base
          const suma = diferencia > 0 && (
            <span className={`font-semibold ${activo ? 'text-brand-cream/70' : 'text-brand-muted'} ${conImagen ? '' : 'ml-1.5'}`}>
              +{formatearPrecio(diferencia)}
            </span>
          )

          if (conImagen) {
            return (
              <button
                key={t.tamanioId}
                type="button"
                role="radio"
                aria-checked={activo}
                aria-label={etiquetaTamanio(t.tamanio, t.etiqueta)}
                onClick={() => onChange(t.tamanioId)}
                className={`flex w-full items-center gap-3 rounded-2xl border-2 border-brand-dark p-2 pr-4 text-left font-bold transition ${
                  activo ? 'bg-brand-dark text-brand-cream' : 'bg-white text-brand-dark hover:translate-y-0.5'
                }`}
              >
                <ImagenFormato src={t.imagen} posicion={posicion} />
                <span className="min-w-0 flex-1 text-lg leading-tight">{etiquetaTamanio(t.tamanio)}</span>
                {suma}
              </button>
            )
          }

          return (
            <button
              key={t.tamanioId}
              type="button"
              role="radio"
              aria-checked={activo}
              aria-label={etiquetaTamanio(t.tamanio, t.etiqueta)}
              onClick={() => onChange(t.tamanioId)}
              className={`min-h-13 rounded-2xl border-2 border-brand-dark px-5 font-bold transition ${
                activo ? 'bg-brand-dark text-brand-cream' : 'bg-white text-brand-dark hover:translate-y-0.5'
              }`}
            >
              {etiquetaTamanio(t.tamanio)}
              {suma}
            </button>
          )
        })}
      </div>
    </SeccionOpciones>
  )
}

export default SelectorTamanio
