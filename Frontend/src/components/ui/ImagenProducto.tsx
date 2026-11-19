import { useEffect, useState } from 'react'
import CategoryIcon from '../icons/CategoryIcon'
import { imagenOptimizada } from '../../utils/imagen'

interface Props {
  src?: string | null
  alt: string
  className?: string
  claseIcono?: string
  ancho?: number
}

const DEFAULT_ICON_CLASS = 'h-20 w-20 text-brand-dark'

function ImagenProducto({ src, alt, className, claseIcono = DEFAULT_ICON_CLASS, ancho }: Props) {
  const [rota, setRota] = useState(false)
  useEffect(() => setRota(false), [src])

  if (!src || rota) return <CategoryIcon icono="generico" className={claseIcono} />

  const imagenFinal = ancho ? (imagenOptimizada(src, ancho) ?? src) : src

  return (
    <img
      src={imagenFinal}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => setRota(true)}
    />
  )
}

export default ImagenProducto
