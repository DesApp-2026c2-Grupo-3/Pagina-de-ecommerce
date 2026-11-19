interface EsqueletoProps {
  // Tamaño que define quien lo usa: "h-4 w-2/3", "size-10"…
  className: string
  // Círculo (avatar, ícono) en lugar de barra
  circular?: boolean
}

// Bloque gris que late mientras se cargan los datos (decorativo para lectores de pantalla)
export default function Esqueleto({ className, circular = false }: EsqueletoProps) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse bg-slate-200 motion-reduce:animate-none ${circular ? 'rounded-full' : 'rounded-md'} ${className}`}
    />
  )
}
