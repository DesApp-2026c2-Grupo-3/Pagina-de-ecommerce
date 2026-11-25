import type { DatosInsumo, Insumo } from '../../types/insumo.types'

// Formulario de crear / editar insumo: valores, validación y datos para el backend,
// movidos tal cual desde la página de Insumos.
export interface FormularioInsumo {
  nombre: string
  precioComercial: string
  stockMinimo: string
}

export const FORMULARIO_INSUMO_VACIO: FormularioInsumo = { nombre: '', precioComercial: '', stockMinimo: '' }

// Al editar, el formulario se autocompleta con el insumo
export function formularioDesdeInsumo(insumo: Insumo): FormularioInsumo {
  return {
    nombre: insumo.nombre,
    precioComercial: insumo.precioComercial != null ? String(insumo.precioComercial) : '',
    stockMinimo: insumo.stockMinimo != null ? String(Number(insumo.stockMinimo)) : '',
  }
}

// Mensaje del primer error, o null si está bien
export function validarFormularioInsumo(form: FormularioInsumo): string | null {
  if (form.nombre.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres.'
  if (form.precioComercial !== '' && Number(form.precioComercial) < 0) return 'El precio del extra no puede ser negativo.'
  if (form.stockMinimo !== '' && Number(form.stockMinimo) < 0) return 'El stock mínimo no puede ser negativo.'
  return null
}

// Por ahora, todos los insumos se miden en unidades
export function datosDesdeFormulario(form: FormularioInsumo): DatosInsumo {
  return {
    nombre: form.nombre.trim(),
    unidadMedida: 'unidad',
    precioComercial: form.precioComercial === '' ? null : Number(form.precioComercial),
    stockMinimo: form.stockMinimo === '' ? null : Number(form.stockMinimo),
  }
}
