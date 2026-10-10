import { useEffect, useState } from 'react'
import { AdvancedMarker, APIProvider, Map } from '@vis.gl/react-google-maps'
import { Clock, MapPin, Navigation, Phone, Store } from 'lucide-react'
import { useZona } from '../../context/ZonaContext'
import { getSucursales } from '../../services/sucursalService'
import type { Sucursal } from '../../types/sucursal'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
const MAP_ID = 'DEMO_MAP_ID'

function direccionDe(s: Sucursal) {
  return `${s.calle}${s.numero ? ` ${s.numero}` : ''}, ${s.localidad}`
}

function linkComoLlegar(s: Sucursal) {
  return `https://www.google.com/maps/dir/?api=1&destination=${s.latitud},${s.longitud}`
}

// Solo la sucursal que atiende la dirección elegida: mapa + tarjeta con los datos
function TuSucursal() {
  const { zona, abrirSelector } = useZona()
  const [sucursales, setSucursales] = useState<Sucursal[]>([])

  useEffect(() => {
    getSucursales()
      .then(setSucursales)
      .catch(() => setSucursales([]))
  }, [])

  const sucursal = sucursales.find((s) => s.id === zona?.sucursalId)

  // Sin dirección elegida: invitación a elegirla
  if (!zona) {
    return (
      <section id="sucursales" className="scroll-mt-24 px-4 py-16">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-6 rounded-[1.75rem] border-2 border-brand-dark bg-white p-6 sm:p-8">
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
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-red px-6 font-bold text-white transition-transform hover:-translate-y-0.5"
          >
            <MapPin className="h-5 w-5" /> Elegir dirección
          </button>
        </div>
      </section>
    )
  }

  if (!sucursal) return null

  const posicion = { lat: sucursal.latitud, lng: sucursal.longitud }

  return (
    <section id="sucursales" className="scroll-mt-24 px-4 py-16">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="h-72 overflow-hidden rounded-[1.75rem] border-2 border-brand-dark bg-brand-sand lg:h-auto lg:min-h-80">
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

        <div className="flex flex-col gap-4 rounded-[1.75rem] border-2 border-brand-dark bg-white p-7">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-muted">Tu sucursal</p>
          <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight">{sucursal.nombre}</h2>
          <p className="flex items-start gap-2 text-brand-muted">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-red" />
            {direccionDe(sucursal)}
          </p>

          <div className="flex flex-col gap-2 border-t-2 border-dashed border-brand-sand pt-4 text-sm">
            {sucursal.horario && (
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0" /> <span className="font-bold">{sucursal.horario}</span>
              </p>
            )}
            {sucursal.telefono && (
              <a href={`tel:${sucursal.telefono}`} className="flex items-center gap-2 hover:text-brand-red">
                <Phone className="h-4 w-4 shrink-0" /> <span className="font-bold">{sucursal.telefono}</span>
              </a>
            )}
            <p className="text-brand-muted">
              A {zona.distanciaKm.toLocaleString('es-AR', { maximumFractionDigits: 1 })} km de tu dirección
            </p>
          </div>

          <div className="mt-auto flex flex-col gap-2 pt-2">
            <a
              href={linkComoLlegar(sucursal)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-red px-6 font-bold text-white transition-transform hover:-translate-y-0.5"
            >
              <Navigation className="h-4 w-4" /> Cómo llegar
            </a>
            <button
              type="button"
              onClick={abrirSelector}
              className="min-h-12 rounded-full bg-brand-dark px-6 font-bold text-brand-cream transition-transform hover:-translate-y-0.5"
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