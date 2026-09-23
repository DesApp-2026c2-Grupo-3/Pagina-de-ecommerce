interface BranchMapProps {
  nombre: string
  latitud: number
  longitud: number
}

const DELTA = 0.01

function BranchMap({ nombre, latitud, longitud }: BranchMapProps) {
  const bbox = [
    longitud - DELTA,
    latitud - DELTA,
    longitud + DELTA,
    latitud + DELTA,
  ].join('%2C')

  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitud}%2C${longitud}`

  return (
    <iframe
      title={`Mapa de ${nombre}`}
      src={src}
      className="h-56 w-full rounded-xl border border-brand-dark/10"
      loading="lazy"
    />
  )
}

export default BranchMap
