interface Punto {
  lat: number
  lng: number
}

// Distancia en línea recta entre dos puntos del mapa, en km (fórmula de Haversine)
export function distanciaKm(a: Punto, b: Punto): number {
  const RADIO_TIERRA_KM = 6371
  const rad = (grados: number) => (grados * Math.PI) / 180

  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2

  return 2 * RADIO_TIERRA_KM * Math.asin(Math.sqrt(h))
}