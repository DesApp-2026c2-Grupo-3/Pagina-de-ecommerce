// Las fotos de los productos se guardan en Cloudinary, que puede entregarlas más livianas si se lo pide en la
// misma URL. En el celular una foto de 1500 px que se muestra a 110 px es peso de más.
//
//   .../image/upload/v123/Productos/Fast-Classic.png
//   .../image/upload/f_auto,q_auto,w_500/v123/Productos/Fast-Classic.png
//
// f_auto = el formato más liviano que entienda el navegador (WebP, AVIF), q_auto = calidad automática,
// w_500 = ancho máximo en píxeles. Lo que no es de Cloudinary (las fotos locales de /imagenes) queda igual.

const PATRON_CLOUDINARY = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/

// Un segmento como "f_auto,q_auto,w_500" o "w_300": ya trae transformaciones, no se le suman otras
const YA_TRANSFORMADA = /^([a-z]{1,3}_[^/,]+)(,[a-z]{1,3}_[^/,]+)*$/

export function imagenOptimizada(src: string | null | undefined, ancho: number): string | null | undefined {
  if (!src) return src
  const coincidencia = PATRON_CLOUDINARY.exec(src)
  if (!coincidencia) return src

  const [, base, resto] = coincidencia
  const primerSegmento = resto.split('/')[0]
  if (YA_TRANSFORMADA.test(primerSegmento)) return src

  return `${base}f_auto,q_auto,w_${Math.round(ancho)}/${resto}`
}
