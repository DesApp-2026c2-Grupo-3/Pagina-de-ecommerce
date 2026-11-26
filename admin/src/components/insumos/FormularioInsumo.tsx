import type { ChangeEvent, FormEvent, RefObject } from 'react'
import type { FormularioInsumo as Formulario } from '../../utils/insumos/formularioInsumo'

interface Props {
  form: Formulario
  editando: boolean
  guardando: boolean
  error: string
  refFormulario: RefObject<HTMLFormElement | null>
  refNombre: RefObject<HTMLInputElement | null>
  onCambiar: (campo: keyof Formulario, valor: string) => void
  onGuardar: (e: FormEvent) => void
  onCancelar: () => void
}

const campo = 'h-11 w-full rounded-lg border border-gray-300 bg-white px-3'
const etiqueta = 'mb-1 block text-sm font-medium'

// Formulario compartido de crear / editar insumo (plan de Insumos v3), con el mismo ancho que la lista:
// escritorio (≥ 64 rem): campos y botones en una fila · tablet: Nombre a lo ancho y dos columnas · móvil: uno por fila.
// Mientras se edita, borde naranja.
export default function FormularioInsumo({
  form,
  editando,
  guardando,
  error,
  refFormulario,
  refNombre,
  onCambiar,
  onGuardar,
  onCancelar,
}: Props) {
  return (
    <form
      ref={refFormulario}
      onSubmit={onGuardar}
      noValidate
      className={`mt-5 scroll-mt-4 rounded-lg border-2 bg-white p-4 @3xl:p-5 ${editando ? 'border-orange-300' : 'border-gray-200'}`}
    >
      <h2 className="mb-3 text-lg font-bold">{editando ? 'Editar insumo' : 'Nuevo insumo'}</h2>

      <div className="grid gap-3 @xl:grid-cols-2 @5xl:grid-cols-[minmax(0,1fr)_11rem_11rem_auto] @5xl:items-end">
        <div className="@xl:col-span-2 @5xl:col-span-1">
          <label htmlFor="insumo-nombre" className={etiqueta}>
            Nombre
          </label>
          <input
            id="insumo-nombre"
            ref={refNombre}
            type="text"
            maxLength={50}
            value={form.nombre}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onCambiar('nombre', e.target.value)}
            className={campo}
            placeholder="Ej: Pepinillos"
          />
        </div>

        <div>
          <label htmlFor="insumo-precio" className={etiqueta}>
            Precio por extra
          </label>
          <input
            id="insumo-precio"
            type="number"
            min="0"
            step="0.01"
            value={form.precioComercial}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onCambiar('precioComercial', e.target.value)}
            className={campo}
            placeholder="Vacío = sin cargo"
          />
        </div>

        <div>
          <label htmlFor="insumo-minimo" className={etiqueta}>
            Stock mínimo sugerido
          </label>
          <input
            id="insumo-minimo"
            type="number"
            min="0"
            step="1"
            value={form.stockMinimo}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onCambiar('stockMinimo', e.target.value)}
            className={campo}
            placeholder="Vacío = sin alerta"
            aria-describedby="insumo-minimo-ayuda"
          />
        </div>

        <div className="flex flex-col-reverse gap-2 @xl:col-span-2 @xl:flex-row @xl:justify-end @5xl:col-span-1">
          {editando && (
            <button
              type="button"
              onClick={onCancelar}
              className="h-11 rounded-lg border border-red-300 bg-danger px-4 text-white transition-colors hover:bg-danger-hover"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={guardando}
            className="h-11 whitespace-nowrap rounded-lg border border-orange-300 bg-action px-4 font-semibold text-white transition-colors hover:bg-action-hover disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear insumo'}
          </button>
        </div>
      </div>

      <p id="insumo-minimo-ayuda" className="mt-2 text-sm text-gray-600">
        {editando
          ? 'El stock mínimo se usa para las sucursales que se creen de acá en adelante. Para cambiar el de una sucursal, andá a su Stock.'
          : 'El stock mínimo se copia como mínimo inicial a todas las sucursales. Después cada una lo puede ajustar en su Stock.'}
      </p>

      {error && (
        <p role="alert" className="mt-3 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </form>
  )
}
