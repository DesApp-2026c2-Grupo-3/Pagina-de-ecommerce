import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { obtenerProductos } from '../services/productoService'
import { DIAS, MAX_PROMOS_POR_DIA, TIPOS_PROMO } from '../config/promociones'
import type { PromocionAdmin, TipoPromo } from '../types/promocion.types'

// ---------- Tipos del formulario (los números van como texto mientras se escriben) ----------

export interface FilaItem {
  productoId: string
  cantidad: string
  // En porcentaje, de 0 a 100 (0 = va a precio de lista, 100 = gratis)
  descuento: string
  // Nombre del producto eliminado que tenía la fila: hay que elegir otro
  eliminado: string
}

export interface DatosPromocion {
  tipo: TipoPromo
  titulo: string
  destacado: string
  detalle: string
  dias: number[]
  maxPorPedido: string
  compraMinima: string
  activo: boolean
  items: FilaItem[]
}

interface ProductoOpcion {
  id: number
  nombre: string
  precio: number
}

const filaVacia = (tipo: TipoPromo): FilaItem => ({
  productoId: '',
  cantidad: '1',
  descuento: tipo === 'REGALO' ? '100' : '',
  eliminado: '',
})

export const promocionVacia: DatosPromocion = {
  tipo: 'DIA',
  titulo: '',
  destacado: '',
  detalle: '',
  dias: [],
  maxPorPedido: '',
  compraMinima: '',
  activo: true,
  items: [filaVacia('DIA')],
}

const aPorcentaje = (descuento: number) => String(Math.round(descuento * 1000) / 10)

// De la promo que devuelve el backend (GET /admin/promociones/:id) al formulario
export function desdePromocion(p: PromocionAdmin): DatosPromocion {
  return {
    tipo: p.tipo,
    titulo: p.titulo,
    destacado: p.destacado,
    detalle: p.detalle,
    dias: p.dias,
    maxPorPedido: p.maxPorPedido ? String(p.maxPorPedido) : '',
    compraMinima: p.compraMinima ? String(p.compraMinima) : '',
    activo: p.activo,
    items: p.items.map((i) => ({
      productoId: i.eliminado ? '' : String(i.productoId),
      cantidad: String(i.cantidad),
      descuento: aPorcentaje(i.descuento),
      eliminado: i.eliminado ? (i.nombre ?? 'un producto') : '',
    })),
  }
}

// Del formulario a lo que espera el backend. Lo que no corresponde al tipo de promo se manda vacío.
export function aPedido(d: DatosPromocion) {
  const llevaLimites = d.tipo !== 'SEMANA'
  return {
    tipo: d.tipo,
    titulo: d.titulo.trim(),
    destacado: d.destacado.trim(),
    detalle: d.detalle.trim(),
    dias: d.tipo === 'DIA' ? d.dias : null,
    maxPorPedido: llevaLimites && d.maxPorPedido !== '' ? Number(d.maxPorPedido) : null,
    compraMinima: llevaLimites && d.compraMinima !== '' ? Number(d.compraMinima) : null,
    activo: d.activo,
    items: d.items.map((i) => ({
      productoId: Number(i.productoId),
      cantidad: Number(i.cantidad),
      descuento: Number(i.descuento) / 100,
    })),
  }
}

// Devuelve el primer error que encuentre, o '' si está todo bien (las mismas reglas que el backend)
function validar(d: DatosPromocion): string {
  if (d.titulo.trim().length < 3) return 'El título debe tener al menos 3 caracteres.'
  if (d.destacado.trim() === '') return 'Escribí lo que va en el círculo (por ejemplo 2×1, 20% o Gratis).'
  if (d.destacado.trim().length > 10) return 'Lo que va en el círculo no puede superar los 10 caracteres.'
  if (d.detalle.trim().length < 5) return 'El detalle debe tener al menos 5 caracteres.'
  if (d.tipo === 'DIA' && d.dias.length === 0) return 'Elegí al menos un día para la promo.'

  for (const [i, fila] of d.items.entries()) {
    const n = i + 1
    if (fila.productoId === '') {
      return fila.eliminado
        ? `El producto "${fila.eliminado}" fue eliminado: elegí otro en la fila ${n}.`
        : `Elegí el producto de la fila ${n}.`
    }
    const cantidad = Number(fila.cantidad)
    if (fila.cantidad === '' || !Number.isInteger(cantidad) || cantidad < 1 || cantidad > 20) {
      return `La cantidad de la fila ${n} debe ser un número entero de 1 a 20.`
    }
    const descuento = Number(fila.descuento)
    if (fila.descuento === '' || Number.isNaN(descuento) || descuento < 0 || descuento > 100) {
      return `El descuento de la fila ${n} debe ser un número de 0 a 100 (0 si va a precio de lista).`
    }
  }

  const ids = d.items.map((i) => i.productoId)
  if (new Set(ids).size !== ids.length) return 'Un producto no puede repetirse en la promo: subí la cantidad en su fila.'
  if (!d.items.some((i) => Number(i.descuento) > 0)) return 'Al menos un producto de la promo tiene que tener descuento.'

  if (d.tipo === 'SEMANA' && (d.items.length !== 1 || d.items[0].cantidad !== '1')) {
    return 'El producto de la semana es un solo producto, de a una unidad.'
  }
  if (d.tipo === 'REGALO' && d.items.some((i) => Number(i.descuento) !== 100)) {
    return 'En el regalo de la semana todos los productos van sin cargo (100 %).'
  }

  if (d.tipo !== 'SEMANA') {
    if (d.maxPorPedido !== '') {
      const max = Number(d.maxPorPedido)
      if (!Number.isInteger(max) || max < 1 || max > 10) return 'El máximo por pedido debe ser un número entero de 1 a 10.'
    }
    if (d.compraMinima !== '') {
      const minima = Number(d.compraMinima)
      if (!Number.isInteger(minima) || minima < 0 || minima > 1000000) {
        return 'La compra mínima debe ser un número entero de 0 a 1.000.000.'
      }
    }
  }

  return ''
}

// Lo que va en el círculo, según los descuentos cargados
function sugerirDestacado(items: FilaItem[]): string {
  const conDescuento = items.filter((i) => Number(i.descuento) > 0)
  if (conDescuento.length === 0) return ''
  const porcentajes = [...new Set(conDescuento.map((i) => Number(i.descuento)))]
  if (porcentajes.length !== 1) return ''
  const porcentaje = porcentajes[0]
  if (porcentaje === 100) return 'Gratis'
  if (porcentaje === 50 && conDescuento.length === 1 && Number(conDescuento[0].cantidad) === 2) return '2×1'
  return `${porcentaje}%`
}

const formatearPrecio = (n: number) => `$${n.toLocaleString('es-AR')}`

// ---------- Estilos compartidos (los mismos del formulario de productos) ----------
const campo = 'w-full rounded border p-2'
const tarjeta = 'rounded-lg border bg-white p-5'
const botonAgregar =
  'inline-flex items-center gap-1 rounded border border-orange-300 px-3 py-1.5 text-sm font-semibold text-action hover:bg-orange-50'
const botonQuitar = 'rounded border bg-red-200 p-2 text-danger hover:text-danger-hover'
const chip = 'rounded-full border px-3 py-1 text-xs font-semibold transition-colors'

const DESCUENTOS_RAPIDOS = [
  { valor: '0', etiqueta: 'Precio de lista' },
  { valor: '20', etiqueta: '20%' },
  { valor: '25', etiqueta: '25%' },
  { valor: '30', etiqueta: '30%' },
  { valor: '50', etiqueta: '50%' },
  { valor: '100', etiqueta: 'Gratis' },
]

interface FormularioPromocionProps {
  inicial: DatosPromocion
  textoBoton: string
  onGuardar: (datos: DatosPromocion) => Promise<void>
  onCancelar: () => void
}

export default function FormularioPromocion({ inicial, textoBoton, onGuardar, onCancelar }: FormularioPromocionProps) {
  const [datos, setDatos] = useState<DatosPromocion>(inicial)
  const [productos, setProductos] = useState<ProductoOpcion[]>([])
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Los productos que se pueden sumar a la promo (los eliminados no vienen)
  useEffect(() => {
    obtenerProductos()
      .then((lista: any[]) =>
        setProductos(
          lista
            .map((p) => ({ id: p.id as number, nombre: p.nombre as string, precio: Number(p.precio) }))
            .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
        ),
      )
      .catch(() => setError('No se pudo cargar la lista de productos. Revisá que el backend esté funcionando.'))
  }, [])

  function cambiar<K extends keyof DatosPromocion>(clave: K, valor: DatosPromocion[K]) {
    setDatos((prev) => ({ ...prev, [clave]: valor }))
    setError('')
  }

  // Al cambiar de tipo se acomoda lo que no corresponde (un solo producto, regalo sin cargo, sin días...)
  function cambiarTipo(tipo: TipoPromo) {
    setDatos((prev) => {
      let items = prev.items
      if (tipo === 'SEMANA') items = items.slice(0, 1).map((i) => ({ ...i, cantidad: '1' }))
      if (tipo === 'REGALO') items = items.map((i) => ({ ...i, descuento: '100' }))
      return {
        ...prev,
        tipo,
        items,
        dias: tipo === 'DIA' ? prev.dias : [],
        maxPorPedido: tipo === 'SEMANA' ? '' : tipo === 'REGALO' && prev.maxPorPedido === '' ? '1' : prev.maxPorPedido,
        compraMinima: tipo === 'SEMANA' ? '' : prev.compraMinima,
      }
    })
    setError('')
  }

  function cambiarFila(indice: number, cambios: Partial<FilaItem>) {
    setDatos((prev) => ({
      ...prev,
      items: prev.items.map((fila, i) => (i === indice ? { ...fila, ...cambios } : fila)),
    }))
    setError('')
  }

  function alternarDia(dia: number) {
    setDatos((prev) => ({
      ...prev,
      dias: prev.dias.includes(dia) ? prev.dias.filter((d) => d !== dia) : [...prev.dias, dia],
    }))
    setError('')
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()

    const errorFormulario = validar(datos)
    if (errorFormulario) {
      setError(errorFormulario)
      return
    }

    setGuardando(true)
    try {
      await onGuardar(datos)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la promoción.')
    } finally {
      setGuardando(false)
    }
  }

  const esSemana = datos.tipo === 'SEMANA'
  const esRegalo = datos.tipo === 'REGALO'
  const esDia = datos.tipo === 'DIA'

  // Referencia de precios con lo que ya está cargado (precio de lista del producto)
  const filasConPrecio = datos.items.map((fila) => {
    const producto = productos.find((p) => String(p.id) === fila.productoId)
    const cantidad = Number(fila.cantidad) || 0
    const descuento = Math.min(Math.max(Number(fila.descuento) || 0, 0), 100) / 100
    return { producto, cantidad, descuento }
  })
  const todasConPrecio = filasConPrecio.length > 0 && filasConPrecio.every((f) => f.producto && f.cantidad > 0)
  const totalLista = filasConPrecio.reduce((s, f) => s + (f.producto ? f.producto.precio * f.cantidad : 0), 0)
  const totalPromo = filasConPrecio.reduce(
    (s, f) => s + (f.producto ? Math.round(f.producto.precio * (1 - f.descuento)) * f.cantidad : 0),
    0,
  )

  return (
    <form onSubmit={enviar} noValidate className="flex max-w-3xl flex-col gap-6">
      {/* ---------- Tipo ---------- */}
      <section className={tarjeta}>
        <h2 className="mb-3 text-lg font-bold">¿Qué tipo de promo es?</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {TIPOS_PROMO.map((t) => (
            <label
              key={t.valor}
              className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                datos.tipo === t.valor ? 'border-orange-400 bg-orange-50' : 'hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="tipo-promo"
                value={t.valor}
                checked={datos.tipo === t.valor}
                onChange={() => cambiarTipo(t.valor)}
                className="sr-only"
              />
              <span className="block font-semibold">{t.titulo}</span>
              <span className="mt-1 block text-sm text-gray-600">{t.detalle}</span>
            </label>
          ))}
        </div>
      </section>

      {/* ---------- Datos que ve el cliente ---------- */}
      <section className={`${tarjeta} flex flex-col gap-4`}>
        <h2 className="text-lg font-bold">Lo que ve el cliente</h2>

        <div>
          <label htmlFor="promo-titulo" className="mb-1 block font-medium">Título</label>
          <input
            id="promo-titulo"
            type="text"
            value={datos.titulo}
            maxLength={60}
            onChange={(e) => cambiar('titulo', e.target.value)}
            placeholder="Ej: Martes de 2×1"
            className={campo}
          />
        </div>

        <div>
          <label htmlFor="promo-detalle" className="mb-1 block font-medium">Detalle</label>
          <textarea
            id="promo-detalle"
            value={datos.detalle}
            maxLength={200}
            rows={2}
            onChange={(e) => cambiar('detalle', e.target.value)}
            placeholder="Ej: Llevás dos Fast Classic y pagás una."
            className={campo}
          />
        </div>

        <div>
          <label htmlFor="promo-destacado" className="mb-1 block font-medium">Lo que va en el círculo</label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              id="promo-destacado"
              type="text"
              value={datos.destacado}
              maxLength={10}
              onChange={(e) => cambiar('destacado', e.target.value)}
              placeholder="2×1, 20%, Gratis"
              className="w-40 rounded border p-2"
            />
            <button
              type="button"
              onClick={() => cambiar('destacado', sugerirDestacado(datos.items))}
              className={`${chip} hover:bg-gray-50`}
            >
              Sugerir según los descuentos
            </button>
          </div>
        </div>

        {/* Vista previa del círculo y el texto */}
        <div className="flex items-center gap-4 rounded-lg border bg-gray-50 p-4">
          <div className="grid h-20 w-20 shrink-0 -rotate-12 place-items-center rounded-full border-[3px] border-gray-900 bg-yellow-300 px-1 text-center text-xl font-extrabold leading-none">
            {datos.destacado.trim() || '—'}
          </div>
          <div className="min-w-0">
            <p className="font-bold">{datos.titulo.trim() || 'Título de la promo'}</p>
            <p className="text-sm text-gray-600">{datos.detalle.trim() || 'El detalle de la promo se ve acá.'}</p>
          </div>
        </div>
      </section>

      {/* ---------- Días (solo las promos del día) ---------- */}
      {esDia && (
        <section className={tarjeta}>
          <h2 className="mb-1 text-lg font-bold">¿Qué días vale?</h2>
          <p className="mb-3 text-sm text-gray-600">
            Cada día puede tener hasta {MAX_PROMOS_POR_DIA} promos activas. Se pide solo esos días.
          </p>
          <div className="flex flex-wrap gap-2">
            {DIAS.map((d) => {
              const elegido = datos.dias.includes(d.valor)
              return (
                <button
                  key={d.valor}
                  type="button"
                  aria-pressed={elegido}
                  title={d.nombre}
                  onClick={() => alternarDia(d.valor)}
                  className={`min-w-14 rounded-lg border px-3 py-2 font-semibold transition-colors ${
                    elegido ? 'border-orange-400 bg-orange-500 text-white' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  {d.corto}
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* ---------- Productos ---------- */}
      <section className={tarjeta}>
        <h2 className="mb-1 text-lg font-bold">Productos de la promo</h2>
        <p className="mb-4 text-sm text-gray-600">
          {esSemana
            ? 'El producto de la semana es un solo producto, de a una unidad.'
            : esRegalo
              ? 'Todo lo que sumes va sin cargo.'
              : 'Cada producto lleva su cantidad y su descuento. El cliente pide la promo completa.'}
        </p>

        <div className="flex flex-col gap-4">
          {datos.items.map((fila, i) => {
            const { producto } = filasConPrecio[i]
            return (
              <div key={i} className="rounded-lg border p-3">
                <div className="grid gap-3 sm:grid-cols-[1fr_6rem_8rem_auto]">
                  <div>
                    <label htmlFor={`promo-producto-${i}`} className="mb-1 block text-sm font-medium">Producto</label>
                    <select
                      id={`promo-producto-${i}`}
                      value={fila.productoId}
                      onChange={(e) => cambiarFila(i, { productoId: e.target.value, eliminado: '' })}
                      className={campo}
                    >
                      <option value="">Elegí un producto</option>
                      {productos.map((p) => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor={`promo-cantidad-${i}`} className="mb-1 block text-sm font-medium">Cantidad</label>
                    <input
                      id={`promo-cantidad-${i}`}
                      type="number"
                      min={1}
                      max={20}
                      value={fila.cantidad}
                      disabled={esSemana}
                      onChange={(e) => cambiarFila(i, { cantidad: e.target.value })}
                      className={`${campo} disabled:bg-gray-100`}
                    />
                  </div>

                  <div>
                    <label htmlFor={`promo-descuento-${i}`} className="mb-1 block text-sm font-medium">Descuento (%)</label>
                    <input
                      id={`promo-descuento-${i}`}
                      type="number"
                      min={0}
                      max={100}
                      step="any"
                      value={fila.descuento}
                      disabled={esRegalo}
                      onChange={(e) => cambiarFila(i, { descuento: e.target.value })}
                      className={`${campo} disabled:bg-gray-100`}
                    />
                  </div>

                  {!esSemana && (
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => setDatos((prev) => ({ ...prev, items: prev.items.filter((_, j) => j !== i) }))}
                        disabled={datos.items.length === 1}
                        aria-label={`Quitar el producto ${i + 1}`}
                        title="Quitar producto"
                        className={`${botonQuitar} disabled:opacity-40`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>

                {fila.eliminado && (
                  <p className="mt-2 text-sm font-medium text-red-700">
                    El producto "{fila.eliminado}" fue eliminado. Elegí otro para que la promo vuelva a mostrarse.
                  </p>
                )}

                {!esRegalo && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {DESCUENTOS_RAPIDOS.map((d) => (
                      <button
                        key={d.valor}
                        type="button"
                        onClick={() => cambiarFila(i, { descuento: d.valor })}
                        className={`${chip} ${
                          fila.descuento === d.valor ? 'border-orange-400 bg-orange-50 text-orange-700' : 'hover:bg-gray-50'
                        }`}
                      >
                        {d.etiqueta}
                      </button>
                    ))}
                  </div>
                )}

                {producto && (
                  <p className="mt-2 text-sm text-gray-600">
                    Precio de lista: {formatearPrecio(producto.precio)} c/u
                    {Number(fila.descuento) > 0 &&
                      ` · con la promo: ${formatearPrecio(Math.round(producto.precio * (1 - filasConPrecio[i].descuento)))} c/u`}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {!esSemana && datos.items.length < 8 && (
          <button
            type="button"
            onClick={() => setDatos((prev) => ({ ...prev, items: [...prev.items, filaVacia(prev.tipo)] }))}
            className={`${botonAgregar} mt-3`}
          >
            <Plus size={16} /> Agregar producto
          </button>
        )}

        {todasConPrecio && (
          <p className="mt-4 rounded bg-gray-50 p-3 text-sm font-medium">
            Total de la promo: {formatearPrecio(totalPromo)}
            {totalLista !== totalPromo && <span className="text-gray-500"> (antes {formatearPrecio(totalLista)})</span>}
          </p>
        )}
      </section>

      {/* ---------- Límites ---------- */}
      {!esSemana && (
        <section className={`${tarjeta} grid gap-4 sm:grid-cols-2`}>
          <div>
            <label htmlFor="promo-max" className="mb-1 block font-medium">Máximo por pedido (opcional)</label>
            <input
              id="promo-max"
              type="number"
              min={1}
              max={10}
              value={datos.maxPorPedido}
              onChange={(e) => cambiar('maxPorPedido', e.target.value)}
              placeholder="Sin límite"
              className={campo}
            />
            <p className="mt-1 text-sm text-gray-600">Cuántas veces se puede pedir la promo en un mismo pedido.</p>
          </div>
          <div>
            <label htmlFor="promo-minima" className="mb-1 block font-medium">Compra mínima en $ (opcional)</label>
            <input
              id="promo-minima"
              type="number"
              min={0}
              max={1000000}
              value={datos.compraMinima}
              onChange={(e) => cambiar('compraMinima', e.target.value)}
              placeholder="Sin mínimo"
              className={campo}
            />
            <p className="mt-1 text-sm text-gray-600">Lo que tiene que sumar el resto del pedido, sin contar la promo.</p>
          </div>
        </section>
      )}

      {/* ---------- Estado ---------- */}
      <section className={tarjeta}>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={datos.activo}
            onChange={(e) => cambiar('activo', e.target.checked)}
            className="h-5 w-5"
          />
          <span>
            <span className="block font-semibold">Promoción activa</span>
            <span className="block text-sm text-gray-600">Si la desactivás, los clientes dejan de verla pero queda guardada.</span>
          </span>
        </label>
      </section>

      {error && <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="flex flex-col justify-end gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onCancelar}
          className="rounded border border-red-300 bg-danger px-4 py-2 text-white transition-colors hover:bg-danger-hover"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={guardando}
          className="rounded border border-orange-300 bg-action px-4 py-2 text-white transition-colors hover:bg-action-hover disabled:opacity-50"
        >
          {guardando ? 'Guardando...' : textoBoton}
        </button>
      </div>
    </form>
  )
}
