import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getSucursales } from '../services/sucursalService'
import { buscarSucursalCercana } from '../utils/sucursales'
import { estadoSucursal, zonaHorariaDeSucursal } from '../utils/horario'
import type { Sucursal } from '../types/sucursal'
import type { UbicacionElegida, Zona } from '../types/zona'

interface ZonaContextType {
  zona: Zona | null
  // true cuando ya llegaron las sucursales (antes no se puede asignar una zona)
  sucursalesCargadas: boolean
  selectorAbierto: boolean
  abrirSelector: () => void
  cerrarSelector: () => void
  // Devuelve el motivo si no se pudo (ej: fuera de zona), o '' si quedó elegida
  elegirUbicacion: (ubicacion: UbicacionElegida) => string
  // Borra la zona (por ejemplo, al cerrar sesión)
  limpiarZona: () => void
}

const ZonaContext = createContext<ZonaContextType | undefined>(undefined)

const ZONA_KEY = 'zona'
const AVISO_ZONA_KEY = 'avisoZonaCerrado'

function leerZonaGuardada(): Zona | null {
  try {
    const guardada = localStorage.getItem(ZONA_KEY)
    if (!guardada) return null
    const zona = JSON.parse(guardada) as Zona
    if (!zona || typeof zona !== 'object') return null
    return {
      ...zona,
      sucursalAbierta: zona.sucursalAbierta !== false,
      sucursalZonaHoraria: zonaHorariaDeSucursal(zona.sucursalZonaHoraria),
    }
  } catch {
    return null
  }
}

function guardarZona(zona: Zona | null) {
  try {
    if (zona) localStorage.setItem(ZONA_KEY, JSON.stringify(zona))
    else localStorage.removeItem(ZONA_KEY)
  } catch {
    // Sin almacenamiento disponible: la zona vive solo mientras la página esté abierta
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

  // Si la sucursal guardada se desactivó, hay que volver a elegir.
  // Si sigue activa, se refresca su estado de apertura (también si cambia el horario).
  useEffect(() => {
    if (!zona || sucursales.length === 0) return

    const sucursal = sucursales.find((s) => s.id === zona.sucursalId)
    if (!sucursal) {
      setZona(null)
      guardarZona(null)
      return
    }

    const actualizar = (sucursal: Sucursal, actual: Zona) => {
      const abierta = estadoSucursal(sucursal.horario, sucursal.zona_horaria).abierta
      const zonaHoraria = zonaHorariaDeSucursal(sucursal.zona_horaria)
      if (actual.sucursalAbierta === abierta && actual.sucursalZonaHoraria === zonaHoraria) return

      const actualizada: Zona = { ...actual, sucursalAbierta: abierta, sucursalZonaHoraria: zonaHoraria }
      setZona(actualizada)
      guardarZona(actualizada)
    }

    actualizar(sucursal, zona)
    const timer = setInterval(() => actualizar(sucursal, zona), 60_000)
    return () => clearInterval(timer)
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
      sucursalAbierta: estadoSucursal(cercana.sucursal.horario, cercana.sucursal.zona_horaria).abierta,
      sucursalZonaHoraria: zonaHorariaDeSucursal(cercana.sucursal.zona_horaria),
    }
    setZona(nueva)
    guardarZona(nueva)
    setSelectorAbierto(false)
    return ''
  }

  // Al cerrar sesión, la ubicación se borra: es del usuario, no del navegador
  function limpiarZona() {
    setZona(null)
    setSelectorAbierto(false)
    guardarZona(null)
    try {
      // Así el globito de "Ingresá tu dirección" vuelve a aparecer
      sessionStorage.removeItem(AVISO_ZONA_KEY)
    } catch {
      // Sin almacenamiento disponible: no hace falta hacer nada más
    }
  }

  return (
    <ZonaContext.Provider
      value={{
        zona,
        sucursalesCargadas: sucursales.length > 0,
        selectorAbierto,
        abrirSelector: () => setSelectorAbierto(true),
        cerrarSelector: () => setSelectorAbierto(false),
        elegirUbicacion,
        limpiarZona,
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
