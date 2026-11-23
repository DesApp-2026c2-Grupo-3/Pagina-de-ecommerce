import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { getSucursales } from '../services/sucursalService'
import { buscarSucursalCercana, sucursalesEnRango, type SucursalCercana } from '../utils/sucursales'
import { estadoSucursal, zonaHorariaDeSucursal } from '../utils/horario'
import type { Sucursal } from '../types/sucursal'
import type { UbicacionElegida, Zona } from '../types/zona'
import { useRefrescoCliente } from '../hooks/useRefrescoCliente'

interface ZonaContextType {
  zona: Zona | null
  // true cuando no se puede pedir a la sucursal asignada: fuera de horario o desactivada
  sucursalCerrada: boolean
  // true cuando la sucursal asignada está desactivada y ninguna otra activa llega a la dirección (RN-04)
  sucursalDesactivada: boolean
  // Borra el aviso de que la zona pasó sola a otra sucursal (DC-12)
  descartarAvisoReemplazo: () => void
  // true cuando ya llegaron las sucursales (antes no se puede asignar una zona)
  sucursalesCargadas: boolean
  selectorAbierto: boolean
  abrirSelector: () => void
  cerrarSelector: () => void
  // Devuelve el motivo si no se pudo (ej: fuera de zona), o '' si quedó elegida
  elegirUbicacion: (ubicacion: UbicacionElegida) => string
  // Borra la zona (por ejemplo, al cerrar sesión)
  limpiarZona: () => void
  // Sucursales que llegan a la dirección de la zona (la primera es la más cercana)
  opcionesSucursal: SucursalCercana[]
  // Cambia la sucursal de la zona por otra que también llegue
  cambiarSucursal: (sucursalId: number) => void
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
  // true cuando llegó al menos una respuesta: una lista vacía también es una respuesta
  const [sucursalesRecibidas, setSucursalesRecibidas] = useState(false)
  const [selectorAbierto, setSelectorAbierto] = useState(false)
  const [versionSucursales, setVersionSucursales] = useState(0)
  const sucursalCerrada = Boolean(zona && zona.sucursalAbierta === false)

  // Desactivada: ya no está entre las sucursales activas (el panel la desactivó)
  const sucursalDesactivada = Boolean(
    zona && sucursalesRecibidas && !sucursales.some((s) => s.id === zona.sucursalId),
  )

  useEffect(() => {
    getSucursales()
      .then((activas) => {
        setSucursales(activas)
        setSucursalesRecibidas(true)
      })
      // Si falla una recarga, queda la última lista: no se cierra ni se cambia la zona por un error de red
      .catch(() => {})
  }, [versionSucursales])

  const refrescarSucursales = useCallback(() => {
    setVersionSucursales((version) => version + 1)
  }, [])

  // Si el panel activa, desactiva o cambia el horario o la ubicación de una sucursal,
  // se vuelven a pedir: el backend es la única fuente de verdad (plan, C-6 y E-4)
  useRefrescoCliente('sucursal', refrescarSucursales)

  // Si la sucursal de la zona se desactivó (ya no está entre las activas), la zona pasa sola a la
  // sucursal activa más cercana que llega a la MISMA dirección (DC-12); nunca a una fuera de rango.
  // Si ninguna llega, la zona se conserva pero queda cerrada hasta que el cliente elija otra
  // dirección (RN-04, RN-46). Si sigue activa, se refresca su estado de apertura (también el horario).
  useEffect(() => {
    if (!zona || !sucursalesRecibidas) return

    const sucursal = sucursales.find((s) => s.id === zona.sucursalId)
    if (!sucursal) {
      const [reemplazo] = sucursalesEnRango({ lat: zona.latitud, lng: zona.longitud }, sucursales)
      if (reemplazo) {
        const nueva: Zona = {
          ...zona,
          sucursalId: reemplazo.sucursal.id,
          sucursalNombre: reemplazo.sucursal.nombre,
          distanciaKm: reemplazo.distancia,
          sucursalAbierta: estadoSucursal(reemplazo.sucursal.horario, reemplazo.sucursal.zona_horaria).abierta,
          sucursalZonaHoraria: zonaHorariaDeSucursal(reemplazo.sucursal.zona_horaria),
          sucursalAnterior: zona.sucursalNombre,
        }
        setZona(nueva)
        guardarZona(nueva)
        return
      }

      if (zona.sucursalAbierta !== false) {
        const cerrada: Zona = { ...zona, sucursalAbierta: false }
        setZona(cerrada)
        guardarZona(cerrada)
      }
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
  }, [zona, sucursales, sucursalesRecibidas])

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

  // Sucursales que llegan a la dirección de la zona (la primera es la más cercana)
  const opcionesSucursal = zona ? sucursalesEnRango({ lat: zona.latitud, lng: zona.longitud }, sucursales) : []

  // Cambia la sucursal de la zona por otra que también llegue a esa dirección
  function cambiarSucursal(sucursalId: number) {
    const opcion = opcionesSucursal.find((o) => o.sucursal.id === sucursalId)
    if (!zona || !opcion) return

    const nueva: Zona = {
      ...zona,
      sucursalId: opcion.sucursal.id,
      sucursalNombre: opcion.sucursal.nombre,
      distanciaKm: opcion.distancia,
      sucursalAbierta: estadoSucursal(opcion.sucursal.horario, opcion.sucursal.zona_horaria).abierta,
      sucursalZonaHoraria: zonaHorariaDeSucursal(opcion.sucursal.zona_horaria),
      sucursalAnterior: undefined,
    }
    setZona(nueva)
    guardarZona(nueva)
  }

  function descartarAvisoReemplazo() {
    if (!zona?.sucursalAnterior) return
    const sinAviso: Zona = { ...zona, sucursalAnterior: undefined }
    setZona(sinAviso)
    guardarZona(sinAviso)
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
        sucursalCerrada,
        sucursalDesactivada,
        descartarAvisoReemplazo,
        sucursalesCargadas: sucursales.length > 0,
        selectorAbierto,
        abrirSelector: () => setSelectorAbierto(true),
        cerrarSelector: () => setSelectorAbierto(false),
        elegirUbicacion,
        limpiarZona,
        opcionesSucursal,
        cambiarSucursal,
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
