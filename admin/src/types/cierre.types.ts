type Persona = { id: number; nombre: string } | null

export interface Cierre {
  id: number
  motivo: string
  desde: string
  por: Persona
  reabiertaEn: string | null
  reabiertaPor: Persona
}

// GET /admin/cierres/sucursal/:id
export interface EstadoCierre {
  cerrada: boolean
  cierreActual: Cierre | null
  historial: Cierre[]
}

// GET /admin/cierres
export interface CierreActivo {
  id: number
  sucursal: { id: number; nombre: string } | null
  motivo: string
  desde: string
  por: Persona
}
