const PATRON_CLOUDINARY = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/
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
