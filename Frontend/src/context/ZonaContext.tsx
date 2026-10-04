import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getSucursales } from '../services/sucursalService'
import { buscarSucursalCercana } from '../utils/sucursales'
import type { Sucursal } from '../types/sucursal'

// La dirección que eligió el cliente (también sirve para guardarla después en sus direcciones)
export interface UbicacionElegida {
  calle: string
  numero: string
  localidad: string
  provincia: string
  codigoPostal: string
  latitud: number
  longitud: number
}

// La ubicación, con la sucursal que le corresponde
export interface Zona extends UbicacionElegida {
  sucursalId: number
  sucursalNombre: string
  distanciaKm: number
}

interface ZonaContextType {
  zona: Zona | null
  selectorAbierto: boolean
  abrirSelector: () => void
  cerrarSelector: () => void
  // Devuelve el motivo si no se pudo (ej: fuera de zona), o '' si quedó elegida
  elegirUbicacion: (ubicacion: UbicacionElegida) => string
}

const ZonaContext = createContext<ZonaContextType | undefined>(undefined)

const ZONA_KEY = 'zona'

function leerZonaGuardada(): Zona | null {
  try {
    const guardada = localStorage.getItem(ZONA_KEY)
    return guardada ? JSON.parse(guardada) : null
  } catch {
    return null
  }
}

export function ZonaProvider({ children }: { children: ReactNode }) {
  const [zona, setZona] = useState<Zona | null>(() => leerZonaGuardada())
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [selectorAbierto, setSelectorAbierto] = useState(false)

  useEffect(() => {
    getSucursales()
      .then(setSucursales)
      .catch(() => setSucursales([]))
  }, [])

  // Si la sucursal guardada se desactivó, hay que volver a elegir
  useEffect(() => {
    if (zona && sucursales.length > 0 && !sucursales.some((s) => s.id === zona.sucursalId)) {
      setZona(null)
      localStorage.removeItem(ZONA_KEY)
    }
  }, [zona, sucursales])

  function elegirUbicacion(ubicacion: UbicacionElegida): string {
    const cercana = buscarSucursalCercana({ lat: ubicacion.latitud, lng: ubicacion.longitud }, sucursales)

    if (!cercana) return 'No pudimos cargar las sucursales. Probá de nuevo en un momento.'
    if (!cercana.dentroDeZona) {
      const km = cercana.distancia.toLocaleString('es-AR', { maximumFractionDigits: 1 })
      return `Todavía no llegamos a esa dirección: la sucursal más cercana, ${cercana.sucursal.nombre}, está a ${km} km.`
    }

    const nueva: Zona = {
      ...ubicacion,
      sucursalId: cercana.sucursal.id,
      sucursalNombre: cercana.sucursal.nombre,
      distanciaKm: cercana.distancia,
    }
    setZona(nueva)
    localStorage.setItem(ZONA_KEY, JSON.stringify(nueva))
    setSelectorAbierto(false)
    return ''
  }

  return (
    <ZonaContext.Provider
      value={{
        zona,
        selectorAbierto,
        abrirSelector: () => setSelectorAbierto(true),
        cerrarSelector: () => setSelectorAbierto(false),
        elegirUbicacion,
      }}
    >
      {children}
    </ZonaContext.Provider>
  )
}

export function useZona() {
  const context = useContext(ZonaContext)
  if (!context) throw new Error('useZona debe usarse dentro de un ZonaProvider')
  return context
}