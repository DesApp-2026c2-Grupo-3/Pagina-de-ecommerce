// Etiqueta de estado con su color. Siempre con texto: el color no es el único indicio.
export default function EstadoBadge({
  texto,
  clases,
  tamano = 'sm',
}: {
  texto: string
  // Fondo y texto, p. ej. «bg-red-100 text-red-800»
  clases: string
  tamano?: 'sm' | 'md'
}) {
  const medida = tamano === 'md' ? 'px-3 py-1 text-sm' : 'px-2.5 py-1 text-xs'
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-md font-semibold ${medida} ${clases}`}>
      {texto}
    </span>
  )
}
