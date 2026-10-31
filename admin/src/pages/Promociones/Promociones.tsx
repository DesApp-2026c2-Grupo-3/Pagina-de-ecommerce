import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ban, CheckCircle, Pencil, Plus, Trash2 } from 'lucide-react'
import Paginacion from '../../components/Paginacion'
import ConfirmarEliminacion from '../../components/ConfirmarEliminacion'
import MensajeVacio from '../../components/MensajeVacio'
import { BarraFiltros, Buscador, SelectFiltro } from '../../components/Filtros'
import { useToast } from '../../context/ToastContext'
import {
  deshabilitarPromocion,
  eliminarPromocion as eliminarPromocionAPI,
  habilitarPromocion,
  obtenerPromociones,
} from '../../services/promocionService'
import { DIAS, MAX_PROMOS_POR_DIA, NOMBRE_TIPO } from '../../config/promociones'
import type { PromocionAdmin, TipoPromo } from '../../types/promocion.types'

const POR_PAGINA = 8

const ORDEN_TIPO: Record<TipoPromo, number> = { SEMANA: 0, REGALO: 1, DIA: 2 }

// Posición del primer día de la promo en la semana (lunes primero), para ordenar la lista
const posicionDelDia = (p: PromocionAdmin) =>
  p.dias.length === 0 ? 0 : Math.min(...p.dias.map((d) => DIAS.findIndex((x) => x.valor === d)))

const cuando = (p: PromocionAdmin) =>
  p.tipo === 'DIA'
    ? DIAS.filter((d) => p.dias.includes(d.valor)).map((d) => d.corto).join(' · ')
    : 'Toda la semana'

const porcentaje = (descuento: number) => `${Math.round(descuento * 1000) / 10}%`

const resumen = (p: PromocionAdmin) =>
  p.items
    .map((i) => {
      const nombre = i.nombre ?? 'Producto eliminado'
      const oferta = i.descuento >= 1 ? ' gratis' : i.descuento > 0 ? ` (${porcentaje(i.descuento)} menos)` : ''
      return `${i.cantidad}× ${nombre}${oferta}`
    })
    .join(' · ')

function Estado({ promo }: { promo: PromocionAdmin }) {
  if (!promo.activo) {
    return <span className="rounded-full bg-gray-200 px-3 py-1 text-sm font-medium text-gray-600">Deshabilitada</span>
  }
  if (!promo.completa) {
    return (
      <span
        className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800"
        title="Un producto de la promo fue eliminado: los clientes no la ven hasta que lo cambies"
      >
        Oculta: producto eliminado
      </span>
    )
  }
  return <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">Activa</span>
}

const botonIcono = 'rounded border p-2 transition-colors'

export default function Promociones() {
  const navigate = useNavigate()
  const { mostrarToast } = useToast()

  const [promociones, setPromociones] = useState<PromocionAdmin[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [paginaActual, setPaginaActual] = useState(1)
  const [aEliminar, setAEliminar] = useState<PromocionAdmin | null>(null)

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroEstado, setFiltroEstado] = useState('todos')

  async function cargar() {
    try {
      setPromociones(await obtenerPromociones())
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las promociones.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  const conReinicio = (setter: (valor: string) => void) => (valor: string) => {
    setter(valor)
    setPaginaActual(1)
  }

  async function cambiarEstado(promo: PromocionAdmin) {
    try {
      if (promo.activo) {
        await deshabilitarPromocion(promo.id)
        mostrarToast('Promoción deshabilitada')
      } else {
        await habilitarPromocion(promo.id)
        mostrarToast('Promoción habilitada')
      }
      await cargar()
    } catch (err) {
      // Por ejemplo, el día ya tiene 3 promos activas
      mostrarToast(err instanceof Error ? err.message : 'No se pudo cambiar el estado de la promoción')
    }
  }

  async function eliminar(promo: PromocionAdmin) {
    try {
      await eliminarPromocionAPI(promo.id)
      mostrarToast('Promoción eliminada!')
      await cargar()
    } catch (err) {
      mostrarToast(err instanceof Error ? err.message : 'No se pudo eliminar la promoción')
    }
  }

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return promociones
      .filter((p) => {
        if (filtroTipo !== 'todos' && p.tipo !== filtroTipo) return false
        if (filtroEstado === 'activas' && !p.activo) return false
        if (filtroEstado === 'deshabilitadas' && p.activo) return false
        if (!texto) return true
        return p.titulo.toLowerCase().includes(texto) || p.items.some((i) => i.nombre?.toLowerCase().includes(texto))
      })
      .sort((a, b) => ORDEN_TIPO[a.tipo] - ORDEN_TIPO[b.tipo] || posicionDelDia(a) - posicionDelDia(b) || a.id - b.id)
  }, [promociones, busqueda, filtroTipo, filtroEstado])

  const ultimaPagina = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA))
  useEffect(() => {
    if (paginaActual > ultimaPagina) setPaginaActual(ultimaPagina)
  }, [paginaActual, ultimaPagina])

  const pagina = filtradas.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA)
  const hayFiltros = busqueda.trim() !== '' || filtroTipo !== 'todos' || filtroEstado !== 'todos'

  const acciones = (p: PromocionAdmin) => (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={() => navigate(`/admin/promociones/editar/${p.id}`)}
        aria-label={`Editar ${p.titulo}`}
        title="Editar promoción"
        className={`${botonIcono} bg-emerald-200 text-success hover:text-success-hover`}
      >
        <Pencil size={18} />
      </button>
      <button
        type="button"
        onClick={() => cambiarEstado(p)}
        aria-label={`${p.activo ? 'Deshabilitar' : 'Habilitar'} ${p.titulo}`}
        title={p.activo ? 'Deshabilitar promoción' : 'Habilitar promoción'}
        className={`${botonIcono} ${
          p.activo ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
        }`}
      >
        {p.activo ? <Ban size={18} /> : <CheckCircle size={18} />}
      </button>
      <button
        type="button"
        onClick={() => setAEliminar(p)}
        aria-label={`Eliminar ${p.titulo}`}
        title="Eliminar promoción"
        className={`${botonIcono} bg-red-200 text-danger hover:text-danger-hover`}
      >
        <Trash2 size={18} />
      </button>
    </div>
  )

  return (
    <main className="p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">Ofertas de la tienda</p>
          <h1 className="text-3xl font-bold">Promociones</h1>
          <p className="mt-2 text-gray-600">
            Armá las promos que se ven en la sección Promos de la tienda. Hay un producto y un regalo de la semana
            activos a la vez, y hasta {MAX_PROMOS_POR_DIA} promos activas por día.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/promociones/nueva')}
          aria-label="Nueva promoción"
          title="Nueva promoción"
          className="shrink-0 rounded-full border border-orange-400 bg-action p-4 text-white shadow-[0_0_10px_rgba(249,115,22,0.6)] transition-all hover:bg-action-hover hover:shadow-[0_0_16px_rgba(249,115,22,0.8)]"
        >
          <Plus size={22} />
        </button>
      </div>

      <BarraFiltros>
        <Buscador valor={busqueda} onChange={conReinicio(setBusqueda)} placeholder="Buscar promo o producto..." />
        <SelectFiltro
          valor={filtroTipo}
          onChange={conReinicio(setFiltroTipo)}
          etiqueta="Filtrar por tipo"
          opciones={[
            { valor: 'todos', etiqueta: 'Todos los tipos' },
            { valor: 'SEMANA', etiqueta: NOMBRE_TIPO.SEMANA },
            { valor: 'REGALO', etiqueta: NOMBRE_TIPO.REGALO },
            { valor: 'DIA', etiqueta: NOMBRE_TIPO.DIA },
          ]}
        />
        <SelectFiltro
          valor={filtroEstado}
          onChange={conReinicio(setFiltroEstado)}
          etiqueta="Filtrar por estado"
          opciones={[
            { valor: 'todos', etiqueta: 'Todas' },
            { valor: 'activas', etiqueta: 'Activas' },
            { valor: 'deshabilitadas', etiqueta: 'Deshabilitadas' },
          ]}
        />
      </BarraFiltros>

      {error && <p className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {cargando ? (
        <p className="text-gray-600">Cargando...</p>
      ) : pagina.length === 0 ? (
        <div className="rounded-lg border bg-white px-6 py-10">
          <MensajeVacio
            mensaje={hayFiltros ? 'No hay promociones con esos filtros.' : 'Todavía no hay promociones cargadas.'}
          />
        </div>
      ) : (
        <>
          {/* Celular: tarjetas */}
          <ul className="flex flex-col gap-3 md:hidden">
            {pagina.map((p) => (
              <li key={p.id} className="flex flex-col gap-3 rounded-lg border bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{p.titulo}</p>
                    <p className="text-sm text-gray-600">{NOMBRE_TIPO[p.tipo]} · {cuando(p)}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-yellow-300 px-3 py-1 text-sm font-extrabold">{p.destacado}</span>
                </div>
                <p className="text-sm text-gray-700">{resumen(p)}</p>
                <div className="flex items-center justify-between gap-3">
                  <Estado promo={p} />
                  {acciones(p)}
                </div>
              </li>
            ))}
          </ul>

          {/* Escritorio: tabla */}
          <div className="hidden overflow-x-auto rounded-lg border bg-white md:block">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left sm:px-6">Promo</th>
                  <th className="px-4 py-3 text-left sm:px-6">Tipo</th>
                  <th className="px-4 py-3 text-left sm:px-6">Cuándo</th>
                  <th className="px-4 py-3 text-left sm:px-6">Incluye</th>
                  <th className="px-4 py-3 text-left sm:px-6">Estado</th>
                  <th className="px-4 py-3 text-right sm:px-6">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagina.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-4 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <span className="shrink-0 rounded-full bg-yellow-300 px-2.5 py-1 text-xs font-extrabold">{p.destacado}</span>
                        <span className="font-medium">{p.titulo}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm sm:px-6">{NOMBRE_TIPO[p.tipo]}</td>
                    <td className="px-4 py-4 text-sm sm:px-6">{cuando(p)}</td>
                    <td className="max-w-xs px-4 py-4 text-sm text-gray-700 sm:px-6">{resumen(p)}</td>
                    <td className="px-4 py-4 sm:px-6"><Estado promo={p} /></td>
                    <td className="px-4 py-4 sm:px-6">{acciones(p)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmarEliminacion
        abierto={aEliminar !== null}
        mensaje={`¿Estás seguro de que querés eliminar la promoción "${aEliminar?.titulo ?? ''}"? Esta acción no se puede deshacer.`}
        onConfirmar={() => {
          if (aEliminar) eliminar(aEliminar)
          setAEliminar(null)
        }}
        onCancelar={() => setAEliminar(null)}
      />

      <Paginacion
        paginaActual={paginaActual}
        totalElementos={filtradas.length}
        elementosPorPagina={POR_PAGINA}
        cambiarPagina={setPaginaActual}
      />
    </main>
  )
}
