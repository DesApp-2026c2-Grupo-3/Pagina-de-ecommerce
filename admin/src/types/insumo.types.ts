// Insumo tal como lo devuelve el backend.
export interface Insumo {
  id: number
  nombre: string
  unidadMedida: string
  precioComercial: string | number | null
}

// Datos que espera el backend al crear o editar un insumo.
export interface DatosInsumo {
  nombre: string
  unidadMedida: string
  precioComercial: number | null
}
