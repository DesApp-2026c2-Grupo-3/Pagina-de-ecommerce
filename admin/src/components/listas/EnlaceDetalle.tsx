import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

// «Ver detalle ›» de las tarjetas: un enlace real (Ctrl+clic abre otra pestaña, botón atrás nativo)
export default function EnlaceDetalle({
  to,
  estado,
  etiqueta,
}: {
  to: string
  // Desde dónde se llegó, para que «Volver» respete filtros y página
  estado: { desde: string }
  etiqueta: string
}) {
  return (
    <Link
      to={to}
      state={estado}
      aria-label={etiqueta}
      className="inline-flex min-h-11 items-center gap-1 whitespace-nowrap rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 @xl:min-h-9"
    >
      Ver detalle <ChevronRight size={16} aria-hidden="true" />
    </Link>
  )
}
