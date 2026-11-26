import { Clock, Lock } from 'lucide-react'

// Lo que se muestra en lugar de una acción: por qué no hay nada que hacer desde el panel
export default function NotaSinAccion({
  texto,
  icono = 'candado',
}: {
  texto: string
  icono?: 'candado' | 'reloj'
}) {
  const Icono = icono === 'reloj' ? Clock : Lock
  return (
    <span className="inline-flex flex-1 items-center gap-1.5 whitespace-nowrap text-sm text-gray-600 @xl:flex-none">
      <Icono size={14} aria-hidden="true" /> {texto}
    </span>
  )
}
