import { useEffect, useState } from 'react'
import { AdvancedMarker, APIProvider, Map } from '@vis.gl/react-google-maps'
import { Clock, MapPin, Navigation, Phone, Store, ChevronDown, ChevronUp, Map as MapIcon } from 'lucide-react'
import { useZona } from '../../context/ZonaContext'
import { getSucursales } from '../../services/sucursalService'
import { formatearHorario } from '../../utils/horario'
import type { Sucursal } from '../../types/sucursal'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
const MAP_ID = 'DEMO_MAP_ID'

// Mapea la dirección completa de la sucursal de forma limpia
function direccionDe(s: Sucursal) {
  return `${s.calle}${s.numero ? ` ${s.numero}` : ''}, ${s.localidad}`
}

// Genera el enlace directo para abrir el ruteo en la app nativa de mapas o web
function linkComoLlegar(s: Sucursal) {
  return `https://google.com{s.latitud},${s.longitud}`
}

function TuSucursal() {
  const { zona, abrirSelector } = useZona()
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  
  // 智能 Acordeón: Controla la apertura del mapa únicamente en pantallas chicas
  const [mostrarMapa, setMostrarMapa] = useState(false)

  useEffect(() => {
    getSucursales()
      .then(setSucursales)
      .catch(() => setSucursales([]))
  }, [])

  const sucursal = sucursales.find((s) => s.id === zona?.sucursalId)

  // Sin dirección elegida: invitación a elegirla
  if (!zona) {
    return (
      <section id="sucursales" className="scroll-mt-24 px-4 py-8 md:py-16">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-6 rounded-[1.75rem] border-2 border-brand-dark bg-white p-5 sm:p-8">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-mustard">
            <Store className="h-7 w-7" />
          </span>
          <div className="min-w-0 flex-1 basis-64">
            <p className="font-display text-2xl font-extrabold">¿Qué sucursal te atiende?</p>
            <p className="text-brand-muted">Elegí tu dirección y te mostramos la sucursal más cercana.</p>
          </div>
          <button
            type="button"
            onClick={abrirSelector}
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-red px-6 font-bold text-white transition-transform hover:translate-y-0.5 w-full sm:w-auto justify-center"
          >
            <MapPin className="h-5 w-5" /> Elegir dirección
          </button>
        </div>
      </section>
    )
  }

  if (!sucursal) return null

  const posicion = { lat: sucursal.latitud, lng: sucursal.longitud }

  // Nodo de renderizado del mapa para no duplicar JSX
  const GoogleMapNode = () => (
    <div className="w-full h-full">
      {API_KEY && (
        <APIProvider apiKey={API_KEY} language="es" region="AR">
          <Map
            mapId={MAP_ID}
            defaultCenter={posicion}
            defaultZoom={15}
            gestureHandling="cooperative"
            disableDefaultUI
            zoomControl
            clickableIcons={false}
            style={{ width: '100%', height: '100%' }}
          >
            <AdvancedMarker position={posicion} title={sucursal.nombre} />
          </Map>
        </APIProvider>
      )}
    </div>
  )

  return (
    <section id="sucursales" className="scroll-mt-24 px-4 py-8 md:py-16">
      {/* 
        La grilla se activa nativamente a partir de md (768px), 
        mostrando las dos columnas fijas e independientes de escritorio
      */}
      <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-[2fr_1fr]">
        
        {/* 
          🗺️ MAPA INTELIGENTE (md:block):
          - Exclusivo en mobile (< md): Pasa de h-0 (oculto) a h-64 de forma animada si abrís la pestaña.
          - En tablets y escritorio (md:): Se clava en h-72 o h-auto de forma permanente, ignorando el botón.
        */}
        <div 
          className={`overflow-hidden rounded-[1.75rem] border-2 border-brand-dark bg-brand-sand transition-all duration-300 md:block h-0 md:h-72 lg:h-auto lg:min-h-80 ${
            mostrarMapa ? 'h-64 mb-4 border-opacity-100' : 'border-opacity-0 md:border-opacity-100'
          }`}
        >
          <GoogleMapNode />
        </div>

        {/* Tarjeta de Información Compactada */}
        <div className="flex flex-col gap-3 md:gap-4 rounded-[1.75rem] border-2 border-brand-dark bg-white p-4 md:p-7 shadow-sticker">
          
          {/* Fila superior: Encabezado de tags + Pestaña de apertura */}
          <div className="flex flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-brand-muted">Tu sucursal</p>
              <span
                className={`rounded-full px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-xs font-extrabold ${
                  zona.sucursalAbierta === false ? 'bg-brand-red text-white' : 'bg-brand-mustard text-brand-dark'
                }`}
              >
                {zona.sucursalAbierta === false ? 'Cerrada ahora' : 'Abierta ahora'}
              </span>
            </div>

            {/* 
              Pestaña Inteligente de Apertura:
              - md:hidden: Se destruye por completo a partir de 768px porque el mapa ya está desplegado fijo al lado.
              - Soporte nativo para eventos táctiles con el dedo y clicks de mouse.
            */}
            <button
              type="button"
              onClick={() => setMostrarMapa(!mostrarMapa)}
              className="md:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-brand-dark/20 text-[10px] font-bold uppercase transition bg-brand-cream text-brand-dark active:scale-95"
            >
              <MapIcon size={12} className="text-brand-red" />
              {mostrarMapa ? 'Ocultar mapa' : 'Ver mapa'}
              {mostrarMapa ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>

          {/* Nombre y Dirección */}
          <h2 className="font-display text-2xl md:text-3xl font-extrabold leading-tight tracking-tight text-brand-dark">{sucursal.nombre}</h2>
          
          <p className="flex items-start gap-2 text-xs sm:text-sm text-brand-muted">
            <MapPin className="mt-0.5 h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-brand-red" />
            {direccionDe(sucursal)}
          </p>

          {/* Horarios y Teléfono (Línea punteada de separación) */}
          <div className="flex flex-col gap-1.5 border-t-2 border-dashed border-brand-sand pt-3.5 text-xs sm:text-sm">
            {sucursal.horario && (
              <p className="flex items-center gap-2 text-brand-dark">
                <Clock className="h-4 w-4 shrink-0 text-brand-muted" />{' '}
                <span className="font-bold">{formatearHorario(sucursal.horario)}</span>
              </p>
            )}
            {sucursal.telefono && (
              <a href={`tel:${sucursal.telefono}`} className="flex items-center gap-2 hover:text-brand-red text-brand-dark">
                <Phone className="h-4 w-4 shrink-0 text-brand-muted" /> <span className="font-bold">{sucursal.telefono}</span>
              </a>
            )}
            <p className="text-[11px] sm:text-xs font-medium text-brand-muted mt-0.5">
              A {zona.distanciaKm.toLocaleString('es-AR', { maximumFractionDigits: 1 })} km de tu dirección
            </p>
          </div>

          {/* Botones inferiores acoplados en paralelo en mobile */}
          <div className="mt-2 md:mt-auto flex flex-row max-[400px]:flex-col gap-2 pt-1 md:flex-col md:gap-2">
            <a
              href={linkComoLlegar(sucursal)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex min-h-[2.5rem] md:min-h-12 items-center justify-center gap-2 rounded-full bg-brand-red px-4 font-bold text-white transition-transform hover:translate-y-0.5 text-xs md:text-sm whitespace-nowrap"
            >
              <Navigation className="h-4 w-4" /> Cómo llegar
            </a>
            <button
              type="button"
              onClick={abrirSelector}
              className="flex-1 min-h-[2.5rem] md:min-h-12 rounded-full bg-brand-dark px-4 font-bold text-brand-cream transition-transform hover:translate-y-0.5 text-xs md:text-sm whitespace-nowrap"
            >
              Cambiar dirección
            </button>
          </div>

        </div>
      </div>
    </section>
  )
}

export default TuSucursal
