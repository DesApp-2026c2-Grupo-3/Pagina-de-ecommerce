import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

// «← Volver a…» de las páginas de detalle
export default function EnlaceVolver({ to, texto }: { to: string; texto: string }) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-11 items-center gap-1.5 self-start font-semibold text-action hover:underline"
    >
      <ArrowLeft size={18} aria-hidden="true" /> {texto}
    </Link>
  )
}
