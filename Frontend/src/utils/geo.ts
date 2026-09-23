/**
 * Distancia en kilómetros entre dos coordenadas usando la fórmula de Haversine.
 *
 * Pensada para más adelante: al validar el envío a domicilio, comparar la
 * dirección del usuario contra `sucursal.latitud/longitud` y descartar
 * las sucursales fuera del radio de cobertura configurado.
 */
export function distanciaKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const RADIO_TIERRA_KM = 6371
  const dLat = gradosARadianes(lat2 - lat1)
  const dLon = gradosARadianes(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(gradosARadianes(lat1)) *
      Math.cos(gradosARadianes(lat2)) *
      Math.sin(dLon / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return RADIO_TIERRA_KM * c
}

function gradosARadianes(grados: number): number {
  return (grados * Math.PI) / 180
}

/** Devuelve la sucursal más cercana a un punto, o null si no hay ninguna. */
export function sucursalMasCercana<T extends { latitud: number; longitud: number }>(
  lat: number,
  lon: number,
  sucursales: T[],
): T | null {
  if (sucursales.length === 0) return null

  return sucursales.reduce((mejor, actual) => {
    const distActual = distanciaKm(lat, lon, actual.latitud, actual.longitud)
    const distMejor = distanciaKm(lat, lon, mejor.latitud, mejor.longitud)
    return distActual < distMejor ? actual : mejor
  })
}
