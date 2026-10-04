import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { obtenerCategorias } from '../services/categoriaService'
import { obtenerProductos, obtenerInsumos, obtenerTamanios } from '../services/productoService'
import { crearInsumo } from '../services/insumoService'

// ---------- Tipos del formulario (los números van como texto mientras se escriben) ----------

export interface FilaReceta {
  insumoId: string
  cantidadBase: string
  esRemovible: boolean
  esAgregable: boolean
}

export interface FilaTamanio {
  tamanioId: number
  activo: boolean
  precio: string
  etiqueta: string
  factorStock: string
}

export interface FilaGrupo {
  nombre: string
  categoriaId: string
  productoIncluidoId: string
  obligatorio: boolean
}

export interface DatosProducto {
  nombre: string
  descripcion: string
  precio: string
  imagen: string
  disponible: boolean
  categoriaId: string
  receta: FilaReceta[]
  tamanios: FilaTamanio[]
  grupos: FilaGrupo[]
}

interface Opcion {
  id: number
  nombre: string
}

interface InsumoOpcion extends Opcion {
  unidadMedida: string
}

interface ProductoOpcion extends Opcion {
  categoriaId: number | null
}

type TipoProducto = 'simple' | 'tamanios' | 'combo'

const TIPOS: { valor: TipoProducto; titulo: string; detalle: string }[] = [
  { valor: 'simple', titulo: 'Simple', detalle: 'Hamburguesas, postres: un solo precio' },
  { valor: 'tamanios', titulo: 'Con tamaños', detalle: 'Papas, bebidas: un precio por tamaño' },
  { valor: 'combo', titulo: 'Combo', detalle: 'Con tamaños y lugares para elegir (papas, bebida)' },
]

export const productoVacio: DatosProducto = {
  nombre: '',
  descripcion: '',
  precio: '',
  imagen: '',
  disponible: true,
  categoriaId: '',
  receta: [],
  tamanios: [],
  grupos: [],
}

// Del producto que devuelve el backend (GET /admin/productos/:id) al formulario
export function desdeProducto(p: any): DatosProducto {
  return {
    nombre: p.nombre ?? '',
    descripcion: p.descripcion ?? '',
    precio: String(p.precio ?? ''),
    imagen: p.imagen ?? '',
    disponible: Boolean(p.disponible),
    categoriaId: p.categoriaId ? String(p.categoriaId) : '',
    receta: (p.receta ?? []).map((r: any) => ({
      insumoId: String(r.insumoId),
      cantidadBase: String(r.cantidadBase),
      esRemovible: Boolean(r.esRemovible),
      esAgregable: Boolean(r.esAgregable),
    })),
    tamanios: (p.tamanios ?? []).map((t: any) => ({
      tamanioId: t.tamanioId,
      activo: true,
      precio: String(t.precio),
      etiqueta: t.etiqueta ?? '',
      factorStock: String(t.factorStock ?? 1),
    })),
    grupos: (p.grupos ?? []).map((g: any) => ({
      nombre: g.nombre,
      categoriaId: String(g.categoriaId),
      productoIncluidoId: String(g.productoIncluidoId),
      obligatorio: Boolean(g.obligatorio),
    })),
  }
}

// Del formulario a lo que espera el backend
export function aPedido(d: DatosProducto) {
  return {
    nombre: d.nombre.trim(),
    descripcion: d.descripcion.trim(),
    precio: Number(d.precio),
    imagen: d.imagen.trim(),
    disponible: d.disponible,
    categoriaId: Number(d.categoriaId),
    receta: d.receta.map((r) => ({
      insumoId: Number(r.insumoId),
      cantidadBase: Number(r.cantidadBase),
      esRemovible: r.esRemovible,
      esAgregable: r.esAgregable,
    })),
    tamanios: d.tamanios
      .filter((t) => t.activo)
      .map((t) => ({
        tamanioId: t.tamanioId,
        precio: Number(t.precio),
        etiqueta: t.etiqueta.trim() || null,
        factorStock: Number(t.factorStock) || 1,
      })),
    grupos: d.grupos.map((g, i) => ({
      nombre: g.nombre.trim(),
      categoriaId: Number(g.categoriaId),
      productoIncluidoId: Number(g.productoIncluidoId),
      obligatorio: g.obligatorio,
      orden: i + 1,
    })),
  }
}

// Devuelve el primer error que encuentre, o '' si está todo bien
function validar(d: DatosProducto, tipo: TipoProducto): string {
  if (d.nombre.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres.'
  if (d.descripcion.trim().length < 15) return 'La descripción debe tener al menos 15 caracteres.'
  if (d.categoriaId === '') return 'Elegí una categoría.'
  if (d.precio === '' || Number(d.precio) <= 0) return 'El precio debe ser mayor a 0.'
  if (Number(d.precio) > 999999) return 'El precio no puede ser mayor a 999999.'
  if (d.imagen.trim().length < 1) return 'La imagen no puede estar vacía.'

  for (const [i, r] of d.receta.entries()) {
    if (r.insumoId === '') return `Elegí el insumo del ingrediente ${i + 1} de la receta.`
    if (r.cantidadBase === '' || Number(r.cantidadBase) < 0) {
      return `Revisá la cantidad del ingrediente ${i + 1} de la receta.`
    }
  }
  const insumos = d.receta.map((r) => r.insumoId)
  if (new Set(insumos).size !== insumos.length) return 'Un insumo no puede repetirse en la receta.'

  // Los productos con tamaños y los combos necesitan al menos un tamaño con precio
  if (tipo !== 'simple') {
    const activos = d.tamanios.filter((t) => t.activo)
    if (activos.length === 0) {
      return 'En "Tamaños", tildá al menos uno (Regular, Mediano o Grande) y ponele precio.'
    }
    if (activos.some((t) => t.precio === '' || Number(t.precio) <= 0)) {
      return 'Cada tamaño tildado necesita un precio mayor a 0.'
    }
  }

  if (tipo === 'combo') {
    if (d.grupos.length === 0) return 'Agregá al menos un lugar al combo (por ejemplo, Bebida).'
    for (const [i, g] of d.grupos.entries()) {
      if (g.nombre.trim().length < 2) return `Poné un nombre al lugar ${i + 1} del combo.`
      if (g.categoriaId === '') return `Elegí la categoría de "${g.nombre}".`
      if (g.productoIncluidoId === '') return `Elegí la opción incluida de "${g.nombre}".`
    }
  }

  return ''
}

// ---------- Estilos compartidos ----------
const campo = 'w-full rounded border p-2'
const tarjeta = 'rounded-lg border bg-white p-5'
const botonAgregar =
  'inline-flex items-center gap-1 rounded border border-orange-300 px-3 py-1.5 text-sm font-semibold text-action hover:bg-orange-50'
const botonQuitar = 'rounded border bg-red-200 p-2 text-danger hover:text-danger-hover'

interface FormularioProductoProps {
  inicial: DatosProducto
  textoBoton: string
  onGuardar: (datos: DatosProducto) => Promise<void>
  onCancelar: () => void
}

export default function FormularioProducto({ inicial, textoBoton, onGuardar, onCancelar }: FormularioProductoProps) {
  const [datos, setDatos] = useState<DatosProducto>(inicial)
  // Al editar, el tipo se deduce de lo que ya tiene el producto
  const [tipo, setTipo] = useState<TipoProducto>(
    inicial.grupos.length > 0 ? 'combo' : inicial.tamanios.length > 0 ? 'tamanios' : 'simple',
  )
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const [categorias, setCategorias] = useState<Opcion[]>([])
  const [insumos, setInsumos] = useState<InsumoOpcion[]>([])
  const [productos, setProductos] = useState<ProductoOpcion[]>([])
  // Alta rápida de un insumo nuevo, sin salir del producto
  const [creandoInsumo, setCreandoInsumo] = useState(false)
  const [nuevoInsumo, setNuevoInsumo] = useState({ nombre: '', unidadMedida: 'unidad', precioComercial: '' })
  const [errorInsumo, setErrorInsumo] = useState('')

  // Carga las listas para los selects, y arma una fila por cada tamaño que existe
  useEffect(() => {
    Promise.all([obtenerCategorias(), obtenerInsumos(), obtenerTamanios(), obtenerProductos()])
      .then(([cats, ins, tams, prods]) => {
        setCategorias(cats)
        setInsumos(ins)
        setProductos(prods)
        setDatos((prev) => ({
          ...prev,
          tamanios: tams.map(
            (t: Opcion) =>
              prev.tamanios.find((x) => x.tamanioId === t.id) ?? {
                tamanioId: t.id,
                activo: false,
                precio: '',
                etiqueta: '',
                factorStock: '1',
              },
          ),
        }))
      })
      .catch(() => setError('No se pudieron cargar las listas del formulario. Revisá que el backend esté funcionando.'))
  }, [])

  function cambiar<K extends keyof DatosProducto>(clave: K, valor: DatosProducto[K]) {
    setDatos((prev) => ({ ...prev, [clave]: valor }))
    setError('')
  }

  function cambiarFila<K extends 'receta' | 'tamanios' | 'grupos'>(
    lista: K,
    indice: number,
    cambios: Partial<DatosProducto[K][number]>,
  ) {
    setDatos((prev) => ({
      ...prev,
      [lista]: prev[lista].map((fila, i) => (i === indice ? { ...fila, ...cambios } : fila)),
    }))
    setError('')
  }

    // Crea el insumo (con su stock en 0 en todas las sucursales) y lo suma a la receta, ya elegido
  async function guardarInsumoNuevo() {
    if (nuevoInsumo.nombre.trim().length < 2) {
      setErrorInsumo('El nombre debe tener al menos 2 caracteres.')
      return
    }
    try {
      const { insumo } = await crearInsumo({
        nombre: nuevoInsumo.nombre.trim(),
        unidadMedida: nuevoInsumo.unidadMedida,
        precioComercial: nuevoInsumo.precioComercial === '' ? null : Number(nuevoInsumo.precioComercial),
      })
      setInsumos((prev) => [...prev, insumo].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      cambiar('receta', [
        ...datos.receta,
        { insumoId: String(insumo.id), cantidadBase: '1', esRemovible: false, esAgregable: false },
      ])
      setNuevoInsumo({ nombre: '', unidadMedida: 'unidad', precioComercial: '' })
      setCreandoInsumo(false)
      setErrorInsumo('')
    } catch (err) {
      setErrorInsumo(err instanceof Error ? err.message : 'No se pudo crear el insumo.')
    }
  }
  const nombreTamanio = (id: number) => ['', 'Regular', 'Mediano', 'Grande'][id] ?? `Tamaño ${id}`

  async function enviar(e: FormEvent) {
    e.preventDefault()

    const errorFormulario = validar(datos, tipo)
    if (errorFormulario) {
      setError(errorFormulario)
      return
    }

    // Lo que no corresponde al tipo se manda vacío, así se borra en el backend
    const aGuardar: DatosProducto = {
      ...datos,
      tamanios: tipo === 'simple' ? datos.tamanios.map((t) => ({ ...t, activo: false })) : datos.tamanios,
      grupos: tipo === 'combo' ? datos.grupos : [],
    }

    setGuardando(true)
    try {
      await onGuardar(aGuardar)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el producto.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="flex max-w-3xl flex-col gap-6">
      {/* ---------- Datos ---------- */}
      <section className={tarjeta}>
        <h2 className="mb-4 text-xl font-bold">Datos</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="font-medium">Nombre</label>
            <input
              type="text"
              maxLength={50}
              value={datos.nombre}
              onChange={(e) => cambiar('nombre', e.target.value)}
              className={campo}
              placeholder="Ej: Doble Cheddar"
            />
          </div>

          <div>
            <label className="font-medium">Descripción</label>
            <textarea
              maxLength={300}
              value={datos.descripcion}
              onChange={(e) => cambiar('descripcion', e.target.value)}
              className={campo}
              placeholder="Ej: Doble medallón con cheddar y cebolla caramelizada"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="font-medium">Categoría</label>
              <select
                value={datos.categoriaId}
                onChange={(e) => cambiar('categoriaId', e.target.value)}
                className={campo}
              >
                <option value="">Seleccionar categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-medium">{tipo === 'simple' ? 'Precio' : 'Precio de referencia'}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={datos.precio}
                onChange={(e) => cambiar('precio', e.target.value)}
                className={campo}
                placeholder="Ej: 9500"
              />
            </div>
          </div>

          <div>
            <label className="font-medium">Imagen</label>
            <input
              type="text"
              value={datos.imagen}
              onChange={(e) => cambiar('imagen', e.target.value)}
              className={campo}
              placeholder="Ej: /imagenes/doble-cheddar.png"
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={datos.disponible}
              onChange={(e) => cambiar('disponible', e.target.checked)}
            />
            Disponible para la venta
          </label>
        </div>
      </section>

      {/* ---------- Tipo de producto ---------- */}
      <section className={tarjeta}>
        <h2 className="mb-4 text-xl font-bold">¿Qué tipo de producto es?</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {TIPOS.map((t) => (
            <label
              key={t.valor}
              className={`flex cursor-pointer flex-col gap-1 rounded border-2 p-3 transition-colors ${
                tipo === t.valor ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-200'
              }`}
            >
              <span className="flex items-center gap-2 font-semibold">
                <input
                  type="radio"
                  name="tipo"
                  checked={tipo === t.valor}
                  onChange={() => {
                    setTipo(t.valor)
                    setError('')
                  }}
                />
                {t.titulo}
              </span>
              <span className="text-sm text-gray-600">{t.detalle}</span>
            </label>
          ))}
        </div>
      </section>

      {/* ---------- Receta (todos los tipos) ---------- */}
      <section className={tarjeta}>
        <h2 className="text-xl font-bold">Receta</h2>
        <p className="mb-4 text-sm text-gray-600">
          Los insumos que lleva, y cuánto. Con esto se descuenta el stock y el cliente puede personalizar.
        </p>

        {datos.receta.length === 0 && (
          <p className="mb-3 text-sm italic text-gray-500">
            Sin receta: el producto no descuenta stock ni se puede personalizar.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {datos.receta.map((fila, i) => {
            const unidad = insumos.find((x) => String(x.id) === fila.insumoId)?.unidadMedida
            return (
              <div
                key={i}
                className="grid items-center gap-2 rounded border p-3 sm:grid-cols-[1fr_8rem_auto_auto_auto]"
              >
                <select
                  value={fila.insumoId}
                  onChange={(e) => cambiarFila('receta', i, { insumoId: e.target.value })}
                  className={campo}
                  aria-label={`Insumo del ingrediente ${i + 1}`}
                >
                  <option value="">Elegir insumo</option>
                  {insumos.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.nombre}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={fila.cantidadBase}
                    onChange={(e) => cambiarFila('receta', i, { cantidadBase: e.target.value })}
                    className={campo}
                    aria-label={`Cantidad del ingrediente ${i + 1}`}
                    placeholder="Ej: 1"
                  />
                  {unidad && <span className="text-xs text-gray-500">{unidad}</span>}
                </div>

                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={fila.esRemovible}
                    onChange={(e) => cambiarFila('receta', i, { esRemovible: e.target.checked })}
                  />
                  Se puede quitar
                </label>

                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={fila.esAgregable}
                    onChange={(e) => cambiarFila('receta', i, { esAgregable: e.target.checked })}
                  />
                  Se puede agregar
                </label>

                <button
                  type="button"
                  onClick={() => cambiar('receta', datos.receta.filter((_, j) => j !== i))}
                  className={botonQuitar}
                  aria-label={`Quitar ingrediente ${i + 1}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              cambiar('receta', [
                ...datos.receta,
                { insumoId: '', cantidadBase: '1', esRemovible: false, esAgregable: false },
              ])
            }
            className={botonAgregar}
          >
            <Plus size={16} /> Agregar ingrediente
          </button>
          {!creandoInsumo && (
            <button
              type="button"
              onClick={() => setCreandoInsumo(true)}
              className="inline-flex items-center gap-1 rounded border px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <Plus size={16} /> Crear insumo nuevo
            </button>
          )}
        </div>

        {/* Alta rápida: no es un <form> propio porque ya está dentro del formulario del producto */}
        {creandoInsumo && (
          <div className="mt-3 rounded border border-orange-200 bg-orange-50 p-4">
            <p className="mb-3 font-semibold">Nuevo insumo</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                type="text"
                maxLength={50}
                autoFocus
                value={nuevoInsumo.nombre}
                onChange={(e) => {
                  setNuevoInsumo({ ...nuevoInsumo, nombre: e.target.value })
                  setErrorInsumo('')
                }}
                // Enter crea el insumo, en lugar de enviar el formulario del producto
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    guardarInsumoNuevo()
                  }
                }}
                className={campo}
                placeholder="Ej: Pepinillos"
                aria-label="Nombre del insumo nuevo"
              />
              <select
                value={nuevoInsumo.unidadMedida}
                onChange={(e) => setNuevoInsumo({ ...nuevoInsumo, unidadMedida: e.target.value })}
                className={campo}
                aria-label="Unidad de medida del insumo nuevo"
              >
                {['unidad', 'kg', 'g', 'litro', 'ml'].map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                step="0.01"
                value={nuevoInsumo.precioComercial}
                onChange={(e) => setNuevoInsumo({ ...nuevoInsumo, precioComercial: e.target.value })}
                className={campo}
                placeholder="Precio por extra (opcional)"
                aria-label="Precio por extra del insumo nuevo"
              />
            </div>
            {errorInsumo && <p className="mt-2 text-sm text-red-700">{errorInsumo}</p>}
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCreandoInsumo(false)
                  setErrorInsumo('')
                }}
                className="rounded border px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarInsumoNuevo}
                className="rounded border border-orange-300 bg-action px-3 py-1.5 text-sm font-semibold text-white hover:bg-action-hover"
              >
                Crear y agregar a la receta
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ---------- Tamaños (productos con tamaños y combos) ---------- */}
      {tipo !== 'simple' && (
        <section className={tarjeta}>
          <h2 className="text-xl font-bold">Tamaños</h2>
          <p className="mb-4 text-sm text-gray-600">
            {tipo === 'combo'
              ? 'El tamaño del combo define el tamaño de las papas y la bebida. Tildá los que se venden, con su precio.'
              : 'Tildá los tamaños que se venden, cada uno con su precio. El factor de stock indica cuánto gasta respecto de la receta (1.5 = 50% más).'}
          </p>

          {datos.tamanios.length === 0 ? (
            <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
              No se pudieron cargar los tamaños (regular, mediano, grande). Revisá que el backend esté funcionando y
              recargá la página.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {datos.tamanios.map((t, i) => (
                <div
                  key={t.tamanioId}
                  className="grid items-center gap-2 rounded border p-3 sm:grid-cols-[8rem_1fr_1fr_1fr]"
                >
                  <label className="flex items-center gap-2 font-medium">
                    <input
                      type="checkbox"
                      checked={t.activo}
                      onChange={(e) => cambiarFila('tamanios', i, { activo: e.target.checked })}
                    />
                    {nombreTamanio(t.tamanioId)}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={!t.activo}
                    value={t.precio}
                    onChange={(e) => cambiarFila('tamanios', i, { precio: e.target.value })}
                    className={`${campo} disabled:bg-gray-100`}
                    placeholder="Precio"
                    aria-label={`Precio ${nombreTamanio(t.tamanioId)}`}
                  />
                  <input
                    type="text"
                    maxLength={30}
                    disabled={!t.activo}
                    value={t.etiqueta}
                    onChange={(e) => cambiarFila('tamanios', i, { etiqueta: e.target.value })}
                    className={`${campo} disabled:bg-gray-100`}
                    placeholder="Ej: 500 ml (opcional)"
                    aria-label={`Etiqueta ${nombreTamanio(t.tamanioId)}`}
                  />
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    disabled={!t.activo}
                    value={t.factorStock}
                    onChange={(e) => cambiarFila('tamanios', i, { factorStock: e.target.value })}
                    className={`${campo} disabled:bg-gray-100`}
                    placeholder="Factor de stock"
                    aria-label={`Factor de stock ${nombreTamanio(t.tamanioId)}`}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ---------- Lugares del combo ---------- */}
      {tipo === 'combo' && (
        <section className={tarjeta}>
          <h2 className="text-xl font-bold">Lugares del combo</h2>
          <p className="mb-4 text-sm text-gray-600">
            Lo que elige el cliente (ej: acompañamiento, bebida). La opción incluida no cobra extra; las demás cobran
            la diferencia de precio.
          </p>

          <div className="flex flex-col gap-3">
            {datos.grupos.map((g, i) => {
              const opciones = productos.filter((p) => String(p.categoriaId) === g.categoriaId)
              return (
                <div
                  key={i}
                  className="grid items-center gap-2 rounded border p-3 sm:grid-cols-[1fr_1fr_1fr_auto_auto]"
                >
                  <input
                    type="text"
                    maxLength={40}
                    value={g.nombre}
                    onChange={(e) => cambiarFila('grupos', i, { nombre: e.target.value })}
                    className={campo}
                    placeholder="Ej: Acompañamiento"
                    aria-label={`Nombre del lugar ${i + 1}`}
                  />
                  <select
                    value={g.categoriaId}
                    onChange={(e) =>
                      // Al cambiar la categoría, la opción incluida anterior deja de servir
                      cambiarFila('grupos', i, { categoriaId: e.target.value, productoIncluidoId: '' })
                    }
                    className={campo}
                    aria-label={`Categoría del lugar ${i + 1}`}
                  >
                    <option value="">Categoría</option>
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                  <select
                    value={g.productoIncluidoId}
                    disabled={g.categoriaId === ''}
                    onChange={(e) => cambiarFila('grupos', i, { productoIncluidoId: e.target.value })}
                    className={`${campo} disabled:bg-gray-100`}
                    aria-label={`Opción incluida del lugar ${i + 1}`}
                  >
                    <option value="">Opción incluida</option>
                    {opciones.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={g.obligatorio}
                      onChange={(e) => cambiarFila('grupos', i, { obligatorio: e.target.checked })}
                    />
                    Obligatorio
                  </label>
                  <button
                    type="button"
                    onClick={() => cambiar('grupos', datos.grupos.filter((_, j) => j !== i))}
                    className={botonQuitar}
                    aria-label={`Quitar lugar ${i + 1}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() =>
              cambiar('grupos', [
                ...datos.grupos,
                { nombre: '', categoriaId: '', productoIncluidoId: '', obligatorio: true },
              ])
            }
            className={`${botonAgregar} mt-3`}
          >
            <Plus size={16} /> Agregar lugar
          </button>
        </section>
      )}

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