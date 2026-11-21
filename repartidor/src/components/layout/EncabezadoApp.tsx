import { useId, useRef } from 'react'
import { Bike, LogOut } from 'lucide-react'

import IndicadorConexion from '../conexion/IndicadorConexion'
import CampanaNotificaciones from '../notificaciones/CampanaNotificaciones'
import BandejaNotificaciones from '../notificaciones/BandejaNotificaciones'
import type { Repartidor } from '../../types/repartidor.types'
import type { EstadoConexion } from '../../types/conexion.types'

interface EncabezadoAppProps {
  repartidor: Repartidor | null
  conexion: EstadoConexion
  noLeidas: number | null
  avisosAbiertos: boolean
  onAlternarAvisos: () => void
  onCerrarAvisos: () => void
  onSalir: () => void
}

// El encabezado de siempre, más el indicador de conexión y la campana (plan UX, sección 31).
// La bandeja vive acá en los dos tamaños: en escritorio cuelga de la campana; en el celular
// es un diálogo modal (capa superior), así que su lugar en el DOM no importa.
export default function EncabezadoApp({
  repartidor,
  conexion,
  noLeidas,
  avisosAbiertos,
  onAlternarAvisos,
  onCerrarAvisos,
  onSalir,
}: EncabezadoAppProps) {
  const ancla = useRef<HTMLDivElement>(null)
  const idCampana = useId()
  const idPanel = useId()

  return (
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20">
          <Bike size={23} aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <p className="font-bold text-slate-900">Repartidor</p>
          <p className="truncate text-xs text-slate-500">Panel de entregas</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <IndicadorConexion estado={conexion} />

        <div ref={ancla} className="relative">
          <div className="hidden md:block">
            <CampanaNotificaciones
              id={idCampana}
              noLeidas={noLeidas}
              abierta={avisosAbiertos}
              idPanel={idPanel}
              onAlternar={onAlternarAvisos}
            />
          </div>
          <BandejaNotificaciones
            abierta={avisosAbiertos}
            onCerrar={onCerrarAvisos}
            idPanel={idPanel}
            idDisparador={idCampana}
            ancla={ancla}
          />
        </div>

        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-800">
            {repartidor?.nombre} {repartidor?.apellido}
          </p>
          <p className="text-xs text-slate-500">
            Sucursal {repartidor?.Sucursal?.nombre ?? `#${repartidor?.sucursalId}`}
          </p>
        </div>

        <button
          type="button"
          onClick={onSalir}
          aria-label="Cerrar sesión"
          className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300"
        >
          <LogOut size={18} aria-hidden="true" />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </div>
  )
}
