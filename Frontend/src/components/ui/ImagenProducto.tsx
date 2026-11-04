import { useEffect, useState } from 'react'
import CategoryIcon from '../icons/CategoryIcon'
import { imagenOptimizada } from '../../utils/imagen'

interface Props {
  src?: string | null
  alt: string
  className?: string
  /** Clases del ícono que se muestra si no hay imagen o el archivo no existe */
  claseIcono?: string
  /** Ancho (px) con el que se pide la foto a Cloudinary; sin esto se usa la original */
  ancho?: number
}

// Foto de un producto. Si no tiene imagen, o el archivo todavía no está en /public, muestra un ícono
// en lugar de la imagen rota del navegador.
function ImagenProducto({ src, alt, className, claseIcono = 'h-20 w-20 text-brand-dark', ancho }: Props) {
  const [rota, setRota] = useState(false)
  useEffect(() => setRota(false), [src])

  if (!src || rota) return <CategoryIcon icono="generico" className={claseIcono} />
  return (
    <img
      src={ancho ? imagenOptimizada(src, ancho) ?? src : src}
      alt={alt}
      className={className}
      // Las que están fuera de pantalla no se bajan hasta que se acerca el scroll
      loading="lazy"
      decoding="async"
      onError={() => setRota(true)}
    />
  )
}

export default ImagenProducto
