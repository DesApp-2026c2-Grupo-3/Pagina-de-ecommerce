import { Star } from 'lucide-react'

// 3,6 → "3,6" (coma decimal, como se escribe en Argentina)
export const formatearPromedio = (valor: number) =>
  valor.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

interface EstrellasPromedioProps {
  /** Entre 0 y 5, con decimales. null = sin calificaciones */
  valor: number | null
  tamanio?: number
}

// Cinco estrellas grises con las amarillas encima, recortadas según el valor:
// con 3,6 se ven tres estrellas llenas y la cuarta al 60 %
export default function EstrellasPromedio({ valor, tamanio = 20 }: EstrellasPromedioProps) {
  const acotado = Math.min(Math.max(valor ?? 0, 0), 5)
  const fila = (clase: string) =>
    [0, 1, 2, 3, 4].map((i) => <Star key={i} size={tamanio} className={`shrink-0 ${clase}`} />)

  return (
    <span
      role="img"
      aria-label={valor === null ? 'Sin calificaciones' : `${formatearPromedio(acotado)} de 5 estrellas`}
      className="relative inline-flex shrink-0"
      style={{ width: tamanio * 5 }}
    >
      <span className="flex" aria-hidden="true">{fila('fill-gray-200 text-gray-300')}</span>
      <span
        className="absolute inset-y-0 left-0 flex overflow-hidden"
        style={{ width: `${(acotado / 5) * 100}%` }}
        aria-hidden="true"
      >
        {fila('fill-yellow-400 text-yellow-500')}
      </span>
    </span>
  )
}
