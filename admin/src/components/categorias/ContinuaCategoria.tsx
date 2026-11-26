import { CornerLeftUp } from 'lucide-react'

// Línea de contexto al principio de una página que empieza con subcategorías cuya principal quedó
// en una página anterior (plan de Categorías v4, D-C6). No es una tarjeta: sin acciones y no cuenta entre las 10.
export default function ContinuaCategoria({ nombre, pagina }: { nombre: string; pagina: number }) {
  return (
    <li className="flex min-w-0 items-start gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700 @xl:items-center @xl:px-4">
      <CornerLeftUp size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-gray-500 @xl:mt-0" />
      <span className="min-w-0 break-words">
        {/* La frase no se parte: si no entra, baja entera (D-C7); el nombre sí puede partirse */}
        <span className="font-bold text-gray-900">{nombre}</span> ·{' '}
        <span className="whitespace-nowrap">viene de la página {pagina}</span>
      </span>
    </li>
  )
}
