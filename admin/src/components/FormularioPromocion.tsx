import { useEffect, useState, type FormEvent } from 'react'
import { AlertTriangle, Plus, Trash2 } from 'lucide-react'
import { obtenerProductos } from '../services/productoService'
import { deshabilitarPromocion, obtenerPromociones } from '../services/promocionService'
import { obtenerParametros } from '../services/parametroService'
import { DIAS, NOMBRE_TIPO, TIPOS_PROMO } from '../config/promociones'
import type { PromocionAdmin, TipoPromo } from '../types/promocion.types'

// ---------- Tipos del formulario (los números van como texto mientras se escriben) ----------

// Cada fila es UNA unidad. Para un 2×1 se agrega el mismo producto dos veces.
export interface FilaItem {
  productoId: string
  // En porcentaje, de 0 a 100 (0 = va a precio de lista, 100 = gratis)
  descuento: string
  // Nombre del producto eliminado que tenía la fila: hay que elegir otro
  eliminado: string
}

export interface DatosPromocion {
  tipo: TipoPromo
  titulo: string
  detalle: string
  dias: number[]
  compraMinima: string
  activo: boolean
  items: FilaItem[]
}

interface ProductoOpcion {
  id: number
  nombre: string
  precio: number
}

// El producto y el regalo de la semana son un solo producto, de a una unidad
const unSoloProducto = (tipo: TipoPromo) => tipo === 'SEMANA' || tipo === 'REGALO'

const filaVacia = (tipo: TipoPromo): FilaItem => ({
  productoId: '',
  descuento: tipo === 'REGALO' ? '100' : '',
  eliminado: '',
})

export const promocionVacia: DatosPromocion = {
  tipo: 'DIA',
  titulo: '',
  detalle: '',
  dias: [],
  compraMinima: '',
  activo: true,
  items: [filaVacia('DIA')],
}

const aPorcentaje = (descuento: number) => String(Math.round(descuento * 1000) / 10)

// De la promo que devuelve el backend al formulario: cada producto se abre en tantas filas como unidades tenga
export function desdePromocion(p: PromocionAdmin): DatosPromocion {
  return {
    tipo: p.tipo,
    titulo: p.titulo,
    detalle: p.detalle,
    dias: p.dias,
    compraMinima: p.compraMinima ? String(p.compraMinima) : '',
    activo: p.activo,
    items: p.items.flatMap((i) =>
      Array.from({ length: i.cantidad }, () => ({
        productoId: i.eliminado ? '' : String(i.productoId),
        descuento: aPorcentaje(i.descuento),
        eliminado: i.eliminado ? (i.nombre ?? 'un producto') : '',
      })),
    ),
  }
}

// Las filas del mismo producto se juntan en una, con la cantidad y el descuento promedio
// (la base no permite el mismo producto dos veces en una promo). El cliente paga lo mismo:
// 1 al 0 % + 1 al 100 % = 2 al 50 %.
function agrupar(filas: FilaItem[]) {
  const porProducto = new Map<number, { cantidad: number; sumaDescuento: number }>()
  for (const fila of filas) {
    const id = Number(fila.productoId)
    const actual = porProducto.get(id) ?? { cantidad: 0, sumaDescuento: 0 }
    porProducto.set(id, { cantidad: actual.cantidad + 1, sumaDescuento: actual.sumaDescuento + Number(fila.descuento) })
  }
  return [...porProducto.entries()].map(([productoId, { cantidad, sumaDescuento }]) => ({
    productoId,
    cantidad,
    // En porcentaje, con un decimal (33,3 %)
    descuento: Math.round((sumaDescuento / cantidad) * 10) / 10,
  }))
}

// Lo que va en el círculo, según los descuentos: "Gratis", "2×1", "3×2", "20%" o "Hasta 50%"
function armarDestacado(items: { cantidad: number; descuento: number }[]): string {
  if (items.every((i) => i.descuento === 100)) return 'Gratis'

  if (items.length === 1 && items[0].cantidad >= 2) {
    const { cantidad, descuento } = items[0]
    const sePagan = cantidad * (1 - descuento / 100)
    const redondo = Math.round(sePagan)
    if (redondo >= 1 && redondo < cantidad && Math.abs(sePagan - redondo) < 0.05) return `${cantidad}×${redondo}`
  }

  const conDescuento = items.filter((i) => i.descuento > 0).map((i) => Math.round(i.descuento))
  const maximo = Math.max(...conDescuento)
  return conDescuento.every((d) => d === maximo) ? `${maximo}%` : `Hasta ${maximo}%`
}

// Del formulario a lo que espera el backend. Lo que no corresponde al tipo de promo se manda vacío.
export function aPedido(d: DatosPromocion) {
  const items = agrupar(d.items)
  return {
    tipo: d.tipo,
    titulo: d.titulo.trim(),
    destacado: armarDestacado(items),
    detalle: d.detalle.trim(),
    dias: d.tipo === 'DIA' ? d.dias : null,
    // El regalo y la promo del día se piden una sola vez por pedido; el producto de la semana, sin límite
    maxPorPedido: d.tipo === 'SEMANA' ? null : 1,
    compraMinima: d.tipo !== 'SEMANA' && d.compraMinima !== '' ? Number(d.compraMinima) : null,
    activo: d.activo,
    items: items.map((i) => ({
      productoId: i.productoId,
      cantidad: i.cantidad,
      descuento: Math.round(i.descuento * 10) / 1000,
    })),
  }
}

// Devuelve el primer error que encuentre, o '' si está todo bien (las mismas reglas que el backend)
function validar(d: DatosPromocion): string {
  if (d.titulo.trim().length < 3) return 'El título debe tener al menos 3 caracteres.'
  if (d.detalle.trim().length < 5) return 'Escribí un detalle de al menos 5 caracteres.'
  if (d.tipo === 'DIA' && d.dias.length === 0) return 'Elegí al menos un día para la promo.'
  if (d.items.length === 0) return 'Agregá al menos un producto.'

  for (const [i, fila] of d.items.entries()) {
    const n = i + 1
    if (fila.productoId === '') return `Elegí el producto de la fila ${n}.`
    const descuento = Number(fila.descuento)
    if (fila.descuento === '' || Number.isNaN(descuento) || descuento < 0 || descuento > 100) {
      return `El descuento de la fila ${n} debe ser un número de 0 a 100.`
    }
  }

  if (!d.items.some((i) => Number(i.descuento) > 0)) return 'Al menos un producto tiene que tener descuento.'
  if (agrupar(d.items).some((i) => i.cantidad > 20)) return 'Un mismo producto no puede repetirse más de 20 veces.'
  if (unSoloProducto(d.tipo) && d.items.length !== 1) {
    return `El ${NOMBRE_TIPO[d.tipo].toLowerCase()} es un solo producto, de a una unidad.`
  }
  if (d.tipo === 'REGALO' && Number(d.items[0].descuento) !== 100) return 'El regalo de la semana va sin cargo (100 %).'

  if (d.tipo !== 'SEMANA' && d.compraMinima !== '') {
    const minima = Number(d.compraMinima)
    if (!Number.isInteger(minima) || minima < 0 || minima > 1000000) {
      return 'La compra mínima debe ser un número entero entre 0 y 1.000.000.'
    }
  }

  return ''
}

const formatearPrecio = (n: number) => `$${n.toLocaleString('es-AR')}`

// ---------- Estilos compartidos (los mismos del formulario de productos) ----------
const campo = 'w-full rounded border p-2'
const tarjeta = 'rounded-lg border bg-white p-5'
const botonAgregar =
  'inline-flex items-center gap-1 rounded border border-orange-300 px-3 py-1.5 text-sm font-semibold text-action hover:bg-orange-50'
const botonQuitar = 'rounded border bg-red-200 p-2 text-danger hover:text-danger-hover'

// Se muestran al hacer clic en el campo de descuento (también se puede escribir otro valor)
const DESCUENTOS_SUGERIDOS = [0, 20, 25, 30, 50, 100]

interface FormularioPromocionProps {
  inicial: DatosPromocion
  textoBoton: string
  /** Al editar: el id de la promo, para no contarla entre las que ya están activas */
  idPropio?: number
  onGuardar: (datos: DatosPromocion) => Promise<void>
  onCancelar: () => void
}

export default function FormularioPromocion({ inicial, textoBoton, idPropio, onGuardar, onCancelar }: FormularioPromocionProps) {
  const [datos, setDatos] = useState<DatosPromocion>(inicial)
  const [productos, setProductos] = useState<ProductoOpcion[]>([])
  // Las otras promos (para avisar antes de guardar si ya hay una activa del mismo tipo o el día está lleno)
  const [promos, setPromos] = useState<PromocionAdmin[]>([])
  const [maxPorDia, setMaxPorDia] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Los productos que se pueden sumar a la promo (los eliminados no vienen), las promos y el máximo por día
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
    obtenerPromociones()
      .then(setPromos)
      .catch(() => setPromos([]))
    obtenerParametros()
      .then((p) => setMaxPorDia(p.maxPromosPorDia))
      .catch(() => setMaxPorDia(null))
  }, [])

  // ---------- Avisos de antemano ----------
  const otrasActivas = promos.filter((p) => p.activo && p.id !== idPropio)
  // Producto o regalo de la semana: hay uno solo activo
  const activaDelTipo = unSoloProducto(datos.tipo) ? otrasActivas.find((p) => p.tipo === datos.tipo) : undefined
  // Promos del día: cuántas activas tiene cada día
  const activasDelDia = (dia: number) => otrasActivas.filter((p) => p.tipo === 'DIA' && p.dias.includes(dia)).length
  const diaLleno = (dia: number) => maxPorDia !== null && activasDelDia(dia) >= maxPorDia
  const diasLlenosElegidos = datos.tipo === 'DIA' ? datos.dias.filter(diaLleno) : []

  async function desactivarAnterior(promo: PromocionAdmin) {
    try {
      await deshabilitarPromocion(promo.id)
      setPromos((prev) => prev.map((p) => (p.id === promo.id ? { ...p, activo: false } : p)))
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo desactivar la promo anterior.')
    }
  }

  function cambiar<K extends keyof DatosPromocion>(clave: K, valor: DatosPromocion[K]) {
    setDatos((prev) => ({ ...prev, [clave]: valor }))
    setError('')
  }

  // Al cambiar de tipo se acomoda lo que no corresponde (un solo producto, regalo sin cargo, sin días...)
  function cambiarTipo(tipo: TipoPromo) {
    setDatos((prev) => {
      let items = prev.items
      if (unSoloProducto(tipo)) items = items.slice(0, 1)
      if (tipo === 'REGALO') items = items.map((i) => ({ ...i, descuento: '100' }))
      return {
        ...prev,
        tipo,
        items,
        dias: tipo === 'DIA' ? prev.dias : [],
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

  // Totales de la promo (precio de lista contra precio con la promo)
  const filasConPrecio = datos.items.map((fila) => {
    const producto = productos.find((p) => String(p.id) === fila.productoId)
    const descuento = (Number(fila.descuento) || 0) / 100
    return { producto, descuento }
  })
  const todasConPrecio = filasConPrecio.length > 0 && filasConPrecio.every((f) => f.producto)
  const totalLista = filasConPrecio.reduce((s, f) => s + (f.producto ? f.producto.precio : 0), 0)
  const totalPromo = filasConPrecio.reduce(
    (s, f) => s + (f.producto ? Math.round(f.producto.precio * (1 - f.descuento)) : 0),
    0,
  )

  return (
    <form onSubmit={enviar} noValidate className="flex max-w-3xl flex-col gap-6">
      {/* Opciones del campo de descuento: aparecen al hacer clic */}
      <datalist id="descuentos-sugeridos">
        {DESCUENTOS_SUGERIDOS.map((d) => (
          <option key={d} value={d} label={d === 0 ? 'Precio de lista' : d === 100 ? 'Gratis' : `${d}%`} />
        ))}
      </datalist>

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

        {/* Ya hay uno activo: se avisa antes de armar el nuevo, y se puede desactivar desde acá */}
        {activaDelTipo && datos.activo && (
          <div role="alert" className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle size={18} className="shrink-0" />
            <p className="min-w-0 flex-1">
              Ya hay un {NOMBRE_TIPO[datos.tipo].toLowerCase()} activo: <strong>"{activaDelTipo.titulo}"</strong>. Para
              guardar esta como activa, hay que desactivar el anterior.
            </p>
            <button
              type="button"
              onClick={() => void desactivarAnterior(activaDelTipo)}
              className="shrink-0 rounded border border-amber-400 bg-white px-3 py-1.5 font-semibold hover:bg-amber-100"
            >
              Desactivarlo ahora
            </button>
          </div>
        )}
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
          <p className="mt-1 text-sm text-gray-600">
            El círculo de la promo ("2×1", "20%", "Gratis") se arma solo con los descuentos de abajo.
          </p>
        </div>
      </section>

      {/* ---------- Días (solo las promos del día) ---------- */}
      {esDia && (
        <section className={tarjeta}>
          <h2 className="mb-1 text-lg font-bold">¿Qué días vale?</h2>
          <p className="mb-3 text-sm text-gray-600">
            {maxPorDia !== null
              ? `Cada día admite hasta ${maxPorDia} promos activas (se configura en Parámetros).`
              : 'Cada día tiene un máximo de promos activas (se configura en Parámetros).'}
          </p>
          <div className="flex flex-wrap gap-2">
            {DIAS.map((d) => {
              const elegido = datos.dias.includes(d.valor)
              const lleno = diaLleno(d.valor)
              return (
                <button
                  key={d.valor}
                  type="button"
                  aria-pressed={elegido}
                  title={lleno ? `${d.nombre}: ya tiene el máximo de promos activas` : d.nombre}
                  onClick={() => alternarDia(d.valor)}
                  className={`min-w-16 rounded-lg border px-3 py-2 font-semibold transition-colors ${
                    elegido
                      ? lleno
                        ? 'border-red-400 bg-red-500 text-white'
                        : 'border-orange-400 bg-orange-500 text-white'
                      : lleno
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  {d.corto}
                  {maxPorDia !== null && (
                    <span className="block text-[11px] font-medium opacity-80">
                      {activasDelDia(d.valor)}/{maxPorDia}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {diasLlenosElegidos.length > 0 && datos.activo && (
            <p role="alert" className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              {diasLlenosElegidos.map((dia) => DIAS.find((d) => d.valor === dia)?.nombre).join(', ')}{' '}
              {diasLlenosElegidos.length === 1 ? 'ya tiene' : 'ya tienen'} el máximo de promos activas. Elegí otro día o
              desactivá alguna de ese día antes de guardar.
            </p>
          )}
        </section>
      )}

      {/* ---------- Productos ---------- */}
      <section className={tarjeta}>
        <h2 className="mb-1 text-lg font-bold">Productos de la promo</h2>
        <p className="mb-4 text-sm text-gray-600">
          {esSemana
            ? 'El producto de la semana es un solo producto, con descuento todos los días.'
            : esRegalo
              ? 'El regalo es un solo producto, sin cargo.'
              : 'Cada fila es una unidad con su descuento. Para un 2×1, agregá el mismo producto dos veces al 50 %.'}
        </p>

        <div className="flex flex-col gap-4">
          {datos.items.map((fila, i) => {
            const { producto } = filasConPrecio[i]
            return (
              <div key={i} className="rounded-lg border p-3">
                <div className="grid gap-3 sm:grid-cols-[1fr_9rem_auto]">
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
                    <label htmlFor={`promo-descuento-${i}`} className="mb-1 block text-sm font-medium">Descuento (%)</label>
                    <input
                      id={`promo-descuento-${i}`}
                      type="number"
                      list="descuentos-sugeridos"
                      min={0}
                      max={100}
                      step="any"
                      value={fila.descuento}
                      disabled={esRegalo}
                      onChange={(e) => cambiarFila(i, { descuento: e.target.value })}
                      placeholder="Elegí o escribí"
                      className={`${campo} disabled:bg-gray-100`}
                    />
                  </div>

                  {!unSoloProducto(datos.tipo) && (
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

                {producto && (
                  <p className="mt-2 text-sm text-gray-600">
                    Precio de lista: {formatearPrecio(producto.precio)}
                    {Number(fila.descuento) > 0 &&
                      ` · con la promo: ${formatearPrecio(Math.round(producto.precio * (1 - filasConPrecio[i].descuento)))}`}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {!unSoloProducto(datos.tipo) && datos.items.length < 8 && (
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

      {/* ---------- Compra mínima (regalo y promo del día). Se pide una vez por pedido. ---------- */}
      {!esSemana && (
        <section className={tarjeta}>
          <label htmlFor="promo-minima" className="mb-1 block font-medium">Compra mínima en $ (opcional)</label>
          <input
            id="promo-minima"
            type="number"
            min={0}
            max={1000000}
            value={datos.compraMinima}
            onChange={(e) => cambiar('compraMinima', e.target.value)}
            placeholder="Sin mínimo"
            className={`${campo} sm:max-w-xs`}
          />
          <p className="mt-1 text-sm text-gray-600">
            Lo que tiene que sumar el resto del pedido, sin contar la promo. La promo se puede pedir una vez por pedido.
          </p>
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