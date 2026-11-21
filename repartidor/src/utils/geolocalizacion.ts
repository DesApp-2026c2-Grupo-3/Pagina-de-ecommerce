export interface Ubicacion {
  latitud: number
  longitud: number
}

const MENSAJES_ERROR: Record<number, string> = {
  1: 'Debés permitir el acceso a tu ubicación para solicitar asistencia.',
  2: 'No se pudo determinar tu ubicación actual.',
  3: 'Se agotó el tiempo para obtener tu ubicación. Intentá nuevamente.',
}

// Única implementación de la app (antes estaba duplicada en Viaje.tsx)
export function obtenerUbicacionActual(): Promise<Ubicacion> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Tu navegador no permite obtener la ubicación.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        resolve({
          latitud: posicion.coords.latitude,
          longitud: posicion.coords.longitude,
        })
      },
      (error) => {
        reject(new Error(MENSAJES_ERROR[error.code] ?? 'Ocurrió un error al obtener tu ubicación.'))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  })
}
