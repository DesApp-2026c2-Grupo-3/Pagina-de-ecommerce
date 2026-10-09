import { useEffect, useState } from 'react'
import { MapPin, Phone, X } from 'lucide-react'
import { obtenerInsumos, obtenerProductos } from '../services/productoService'

const API_URL = 'http://localhost:3000/admin/pedidos'
const TAMANIOS: Record<number, string> = { 1: 'Regular', 2: 'Mediano', 3: 'Grande' }

interface Personalizacion {
  insumoId: number
  cantidad: number
}

interface EleccionCombo {
  grupoId: number
  productoId: number
  recargo?: number
}

interface DetalleLinea {
  id: number
  productoId: number
  cantidad: number
  precio: string | number
  tamanioId: number | null
  personalizaciones: Personalizacion[] | string | null
  combo: { elecciones?: EleccionCombo[] } | string | null
  Producto: { id: number; nombre: string } | null
}

interface PedidoCompleto {
  id: number
  fecha: string
  estado: string
  total: string | number
  Usuario: { nombre: string; apellido: string; email: string; telefono: string | null } | null
  Direccion: {
    alias: string
    calle: string
    numero: string
    piso: string | null
    localidad: string | null
    provincia: string | null
    observaciones: string | null
    latitud: string | number | null
    longitud: string | number | null
  } | null
  Sucursal: { nombre: string } | null
  DetallePedidos: DetalleLinea[]
}

// Lo que hace falta del catálogo para traducir ids a nombres
interface ProductoCatalogo {
  id: number
  nombre: string
  receta?: { insumoId: number; cantidadBase: number }[]
  grupos?: { id: number; nombre: string }[]
}

interface Props {
  pedidoId: number | null
  onClose: () => void
}

const precio = (n: number) => `$${n.toLocaleString('es-AR')}`

// Las columnas JSON pueden llegar como texto según la base
function comoJson<T>(valor: T | string | null | undefined): T | null {
  if (valor == null) return null
  if (typeof valor !== 'string') return valor
  try {
    return JSON.parse(valor) as T
  } catch {
    return null
  }
}

function formatearFechaHora(valor: string) {
  return new Date(valor).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export default function DetallePedidoModal({ pedidoId, onClose }: Props) {
  const [pedido, setPedido] = useState<PedidoCompleto | null>(null)
  const [productos, setProductos] = useState<Map<number, ProductoCatalogo>>(new Map())
  const [insumos, setInsumos] = useState<Map<number, string>>(new Map())
  const [error, setError] = useState('')

  useEffect(() => {
    if (pedidoId === null) return
    let cancelado = false
    setPedido(null)
    setError('')

    Promise.all([
      fetch(`${API_URL}/${pedidoId}`, { credentials: 'include' }).then(async (r) => {
        const datos = await r.json().catch(() => null)
        if (!r.ok) throw new Error(datos?.mensaje ?? datos?.msj ?? 'No se pudo cargar el pedido')
        return datos as PedidoCompleto
      }),
      // Si el catálogo no carga, el detalle se muestra igual, con ids en lugar de nombres
      obtenerProductos().catch(() => []),
      obtenerInsumos().catch(() => []),
    ])
      .then(([detalle, prods, ins]) => {
        if (cancelado) return
        setPedido(detalle)
        setProductos(new Map((prods as ProductoCatalogo[]).map((p) => [p.id, p])))
        setInsumos(new Map((ins as { id: number; nombre: string }[]).map((i) => [i.id, i.nombre])))
      })
      .catch((err) => !cancelado && setError(err instanceof Error ? err.message : 'No se pudo cargar el pedido'))

    return () => {
      cancelado = true
    }
  }, [pedidoId])

  // Esc cierra
  useEffect(() => {
    if (pedidoId === null) return
    const alApretar = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', alApretar)
    return () => document.removeEventListener('keydown', alApretar)
  }, [pedidoId, onClose])

  if (pedidoId === null) return null

  const nombreProducto = (id: number) => productos.get(id)?.nombre ?? `Producto #${id}`
  const nombreInsumo = (id: number) => insumos.get(id) ?? `Insumo #${id}`

  // "Sin Cebolla", "+1 Cheddar", según la receta del producto
  function textosPersonalizacion(linea: DetalleLinea): string[] {
    const receta = productos.get(linea.productoId)?.receta ?? []
    return (comoJson<Personalizacion[]>(linea.personalizaciones) ?? []).map((p) => {
      const nombre = nombreInsumo(Number(p.insumoId))
      const base = receta.find((r) => r.insumoId === Number(p.insumoId))?.cantidadBase
      if (Number(p.cantidad) === 0) return `Sin ${nombre}`
      if (base != null && p.cantidad > base) return `+${p.cantidad - base} ${nombre}`
      return `${nombre} x${p.cantidad}`
    })
  }

  // "Papas: Papas con cheddar (+$800)"
  function textosCombo(linea: DetalleLinea): string[] {
    const grupos = productos.get(linea.productoId)?.grupos ?? []
    return (comoJson<{ elecciones?: EleccionCombo[] }>(linea.combo)?.elecciones ?? []).map((e) => {
      const lugar = grupos.find((g) => g.id === e.grupoId)?.nombre ?? 'Opción'
      const recargo = Number(e.recargo ?? 0)
      return `${lugar}: ${nombreProducto(e.productoId)}${recargo > 0 ? ` (+${precio(recargo)})` : ''}`
    })
  }

  const d = pedido?.Direccion
  const linkMapa =
    d?.latitud != null && d?.longitud != null
      ? `https://www.google.com/maps?q=${d.latitud},${d.longitud}`
      : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-detalle-pedido"
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="titulo-detalle-pedido" className="text-xl font-bold">
              Pedido #{pedidoId}
            </h2>
            {pedido && (
              <p className="text-sm text-gray-600">
                {formatearFechaHora(pedido.fecha)} · {pedido.Sucursal?.nombre ?? 'Sucursal'} · {pedido.estado}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded p-1 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {error && <p className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {!pedido && !error && <p className="mt-4 text-gray-600">Cargando...</p>}

        {pedido && (
          <>
            {/* ---------- Productos ---------- */}
            <h3 className="mt-6 font-semibold">Productos</h3>
            <ul className="mt-2 flex flex-col divide-y rounded border">
              {pedido.DetallePedidos.map((linea) => {
                const extras = [
                  linea.tamanioId ? TAMANIOS[linea.tamanioId] ?? null : null,
                  ...textosCombo(linea),
                  ...textosPersonalizacion(linea),
                ].filter(Boolean) as string[]
                return (
                  <li key={linea.id} className="flex items-start justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {linea.cantidad}× {linea.Producto?.nombre ?? nombreProducto(linea.productoId)}
                      </p>
                      {extras.length > 0 && (
                        <ul className="mt-1 text-sm text-gray-600">
                          {extras.map((t, i) => (
                            <li key={i}>• {t}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <span className="shrink-0 font-semibold">
                      {precio(Number(linea.precio) * linea.cantidad)}
                    </span>
                  </li>
                )
              })}
            </ul>
            <p className="mt-2 text-right text-lg font-bold">Total: {precio(Number(pedido.total))}</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {/* ---------- Entrega ---------- */}
              <section className="rounded border p-3">
                <h3 className="font-semibold">Entrega</h3>
                {d ? (
                  <>
                    <p className="mt-1 text-sm">
                      {d.calle} {d.numero}
                      {d.piso && `, ${d.piso}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      {[d.localidad, d.provincia].filter(Boolean).join(', ')}
                    </p>
                    {d.observaciones && (
                      <p className="mt-2 rounded bg-amber-50 p-2 text-sm text-amber-800">📝 {d.observaciones}</p>
                    )}
                    {linkMapa && (
                      <a
                        href={linkMapa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-action hover:underline"
                      >
                        <MapPin size={14} /> Ver en el mapa
                      </a>
                    )}
                  </>
                ) : (
                  <p className="mt-1 text-sm text-gray-500">Sin dirección</p>
                )}
              </section>

              {/* ---------- Cliente ---------- */}
              <section className="rounded border p-3">
                <h3 className="font-semibold">Cliente</h3>
                {pedido.Usuario ? (
                  <>
                    <p className="mt-1 text-sm">
                      {pedido.Usuario.nombre} {pedido.Usuario.apellido}
                    </p>
                    <p className="text-sm text-gray-600">{pedido.Usuario.email}</p>
                    {pedido.Usuario.telefono && (
                      <a
                        href={`tel:${pedido.Usuario.telefono}`}
                        className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-action hover:underline"
                      >
                        <Phone size={14} /> {pedido.Usuario.telefono}
                      </a>
                    )}
                  </>
                ) : (
                  <p className="mt-1 text-sm text-gray-500">Cliente no disponible</p>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  )
}