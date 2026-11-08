import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import MensajeVacio from '../../components/MensajeVacio'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { crearParte, obtenerCatalogoDeSucursal, obtenerPartes, resolverParte } from '../../services/parteService'
import type { EstadoParte, Parte, TipoParte } from '../../types/notificacion.types'
import { fechaCorta, haceCuanto } from '../../utils/tiempo'

const TIPOS: { valor: TipoParte; texto: string }[] = [
  { valor: 'EQUIPO', texto: 'Equipo roto' },
  { valor: 'INSUMO', texto: 'Falta de insumo' },
  { valor: 'PEDIDO', texto: 'Problema con un pedido' },
  { valor: 'OTRO', texto: 'Otro' },
]
const TEXTO_TIPO = Object.fromEntries(TIPOS.map((t) => [t.valor, t.texto])) as Record<TipoParte, string>

const ESTILO_ESTADO: Record<EstadoParte, { texto: string; clase: string }> = {
  ENVIADO: { texto: 'Enviado', clase: 'bg-gray-200 text-gray-700' },
  VISTO: { texto: 'Visto', clase: 'bg-blue-100 text-blue-700' },
  RESUELTO: { texto: 'Resuelto', clase: 'bg-green-100 text-green-700' },
}

const campoClase = 'w-full rounded border p-2'

function Dialogo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="w-full max-w-md rounded-lg border-2 bg-white p-6 shadow-xl">
        <h2 className="mb-3 text-xl font-bold">{titulo}</h2>
        {children}
      </div>
    </div>
  )
}

// Formulario del empleado: le avisa a los encargados de su sucursal
function FormularioParte({ sucursalId, alEnviar }: { sucursalId: number | null; alEnviar: () => void }) {
  const { mostrarToast } = useToast()
  const [tipo, setTipo] = useState<TipoParte>('EQUIPO')
  const [urgente, setUrgente] = useState(false)
  const [descripcion, setDescripcion] = useState('')
  const [pedido, setPedido] = useState('')
  const [catalogo, setCatalogo] = useState<{ id: number; nombre: string }[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [elegidos, setElegidos] = useState<Set<number>>(new Set())
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (tipo !== 'EQUIPO' || sucursalId == null || catalogo.length > 0) return
    obtenerCatalogoDeSucursal(sucursalId)
      .then((lista) => setCatalogo(Array.isArray(lista) ? lista : []))
      .catch(() => setCatalogo([]))
  }, [tipo, sucursalId, catalogo.length])

  const visibles = catalogo.filter((p) => p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())).slice(0, 50)

  const alternar = (id: number) =>
    setElegidos((actual) => {
      const nueva = new Set(actual)
      if (nueva.has(id)) nueva.delete(id)
      else nueva.add(id)
      return nueva
    })

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (descripcion.trim().length < 5) {
      setError('Contá qué pasó (al menos 5 caracteres).')
      return
    }
    if (tipo === 'PEDIDO' && pedido !== '' && !(Number.isInteger(Number(pedido)) && Number(pedido) > 0)) {
      setError('El número de pedido no es válido.')
      return
    }
    setEnviando(true)
    setError('')
    try {
      const r = await crearParte({
        tipo,
        descripcion: descripcion.trim(),
        urgencia: urgente ? 'URGENTE' : 'NORMAL',
        productoIds: tipo === 'EQUIPO' ? [...elegidos] : [],
        pedidoId: tipo === 'PEDIDO' && pedido !== '' ? Number(pedido) : null,
      })
      mostrarToast(
        r.avisados === 0
          ? 'Parte guardado, pero tu sucursal no tiene encargados activos'
          : `Parte enviado a ${r.avisados === 1 ? '1 encargado' : `${r.avisados} encargados`}`,
      )
      setDescripcion('')
      setPedido('')
      setUrgente(false)
      setElegidos(new Set())
      alEnviar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el parte.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="mb-8 flex max-w-3xl flex-col gap-4 rounded-lg border bg-white p-4 shadow-sm md:p-6">
      <h2 className="text-xl font-semibold">Avisar al encargado</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block font-medium" htmlFor="parte-tipo">¿Qué pasó?</label>
          <select id="parte-tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoParte)} className={campoClase}>
            {TIPOS.map((t) => (
              <option key={t.valor} value={t.valor}>{t.texto}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 self-end pb-2">
          <input type="checkbox" checked={urgente} onChange={(e) => setUrgente(e.target.checked)} className="h-4 w-4" />
          <span className="font-medium">Es urgente</span>
        </label>
      </div>

      <div>
        <label className="mb-1 block font-medium" htmlFor="parte-descripcion">Descripción</label>
        <textarea
          id="parte-descripcion"
          value={descripcion}
          onChange={(e) => { setDescripcion(e.target.value); setError('') }}
          maxLength={300}
          rows={3}
          placeholder="Ej: se rompió la máquina de café y no calienta la leche"
          className={campoClase}
        />
        <p className="text-right text-xs text-gray-500">{descripcion.length}/300</p>
      </div>

      {tipo === 'PEDIDO' && (
        <div>
          <label className="mb-1 block font-medium" htmlFor="parte-pedido">N.° de pedido (opcional)</label>
          <input id="parte-pedido" type="number" min="1" value={pedido} onChange={(e) => setPedido(e.target.value)} className={`${campoClase} sm:w-48`} />
        </div>
      )}

      {tipo === 'EQUIPO' && (
        <div>
          <p className="mb-1 font-medium">Productos que no se pueden hacer (opcional)</p>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar producto..."
            aria-label="Buscar producto"
            className={`${campoClase} mb-2`}
          />
          <ul className="max-h-48 overflow-y-auto rounded border">
            {visibles.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500">No hay productos para mostrar.</li>
            ) : (
              visibles.map((p) => (
                <li key={p.id} className="border-b last:border-b-0">
                  <label className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50">
                    <input type="checkbox" checked={elegidos.has(p.id)} onChange={() => alternar(p.id)} className="h-4 w-4" />
                    <span>{p.nombre}</span>
                  </label>
                </li>
              ))
            )}
          </ul>
          {elegidos.size > 0 && <p className="mt-1 text-sm text-gray-600">{elegidos.size} elegido(s)</p>}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <button type="submit" disabled={enviando} className="rounded border border-black bg-action px-4 py-2 text-white hover:bg-action-hover disabled:opacity-50">
          {enviando ? 'Enviando...' : 'Enviar parte'}
        </button>
      </div>
    </form>
  )
}

export default function Partes() {
  const { administrador } = useAuth()
  const { mostrarToast } = useToast()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const esEncargado = administrador?.rol === 'ADMIN'
  const destacado = Number(params.get('parte')) || null

  const [filtro, setFiltro] = useState<'pendientes' | 'resueltos' | 'todos'>('pendientes')
  const [partes, setPartes] = useState<Parte[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [aResolver, setAResolver] = useState<Parte | null>(null)
  const [nota, setNota] = useState('')
  const [enviando, setEnviando] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      setPartes(await obtenerPartes(filtro === 'todos' ? undefined : filtro))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los partes.')
    } finally {
      setCargando(false)
    }
  }, [filtro])

  useEffect(() => {
    void cargar()
  }, [cargar])

  useEffect(() => {
    if (destacado == null || partes.length === 0) return
    document.getElementById(`parte-${destacado}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [destacado, partes])

  const resolver = async () => {
    if (!aResolver) return
    setEnviando(true)
    try {
      await resolverParte(aResolver.id, nota.trim())
      mostrarToast('Parte resuelto')
      setAResolver(null)
      setNota('')
      await cargar()
    } catch (e) {
      mostrarToast(e instanceof Error ? e.message : 'No se pudo resolver el parte')
    } finally {
      setEnviando(false)
    }
  }

  // Lleva a Productos con esos productos ya marcados y el motivo sugerido
  const suspender = (p: Parte) => {
    const motivo = `Parte de ${p.creadoPor?.nombre ?? 'un empleado'}: ${p.descripcion}`.slice(0, 200)
    navigate(`/admin/disponibilidad?productos=${p.productos.map((x) => x.id).join(',')}&motivo=${encodeURIComponent(motivo)}`)
  }

  const tab = (activo: boolean) => `rounded border px-4 py-2 font-medium ${activo ? 'bg-action text-white' : 'bg-white hover:bg-gray-100'}`

  return (
    <main className="p-4 md:p-8">
      <h1 className="text-3xl font-bold">Partes</h1>
      <p className="mt-2 mb-6 text-gray-600">
        {esEncargado
          ? 'Los avisos de tu equipo. Al abrir uno queda como visto; cuando lo resolvés, el empleado se entera.'
          : 'Avisale a los encargados de tu sucursal cuando algo no anda. Acá seguís cómo van tus partes.'}
      </p>

      {!esEncargado && <FormularioParte sucursalId={administrador?.sucursalId ?? null} alEnviar={() => void cargar()} />}

      <div className="mb-5 flex flex-wrap gap-2">
        <button type="button" onClick={() => setFiltro('pendientes')} className={tab(filtro === 'pendientes')}>Pendientes</button>
        <button type="button" onClick={() => setFiltro('resueltos')} className={tab(filtro === 'resueltos')}>Resueltos</button>
        <button type="button" onClick={() => setFiltro('todos')} className={tab(filtro === 'todos')}>Todos</button>
      </div>

      {error && <p className="mb-4 text-red-600">{error}</p>}
      {cargando && partes.length === 0 && <p className="text-gray-600">Cargando...</p>}

      {!cargando && !error && partes.length === 0 ? (
        <div className="rounded-lg border bg-white px-6 py-10">
          <MensajeVacio mensaje={filtro === 'pendientes' ? 'No hay partes pendientes.' : 'No hay partes para mostrar.'} />
        </div>
      ) : (
        <ul className="flex max-w-3xl flex-col gap-4">
          {partes.map((p) => (
            <li
              key={p.id}
              id={`parte-${p.id}`}
              className={`rounded-lg border bg-white p-4 shadow-sm ${destacado === p.id ? 'ring-2 ring-orange-400' : ''}`}
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="font-semibold">{TEXTO_TIPO[p.tipo]}</span>
                {p.urgencia === 'URGENTE' && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">Urgente</span>}
                <span className={`rounded-full px-3 py-0.5 text-sm font-medium ${ESTILO_ESTADO[p.estado].clase}`}>{ESTILO_ESTADO[p.estado].texto}</span>
              </div>

              <p className="break-words">{p.descripcion}</p>

              {p.productos.length > 0 && (
                <p className="mt-2 flex flex-wrap gap-1 text-sm">
                  {p.productos.map((x) => (
                    <span key={x.id} className="rounded bg-gray-100 px-2 py-0.5">{x.nombre}</span>
                  ))}
                </p>
              )}
              {p.pedidoId && <p className="mt-1 text-sm text-gray-600">Pedido N.° {p.pedidoId}</p>}

              <p className="mt-2 text-sm text-gray-500" title={fechaCorta(p.creadoEn)}>
                {esEncargado ? `${p.creadoPor?.nombre ?? 'Sin dato'} · ` : ''}{haceCuanto(p.creadoEn)}
                {p.vistoPor && p.estado !== 'RESUELTO' ? ` · Visto por ${p.vistoPor.nombre}` : ''}
              </p>

              {p.estado === 'RESUELTO' && (
                <p className="mt-1 text-sm text-green-700">
                  Resuelto por {p.resueltoPor?.nombre ?? 'Sin dato'}{p.resueltoEn ? ` · ${fechaCorta(p.resueltoEn)}` : ''}
                  {p.nota ? ` — ${p.nota}` : ''}
                </p>
              )}

              {esEncargado && p.estado !== 'RESUELTO' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {p.productos.length > 0 && (
                    <button type="button" onClick={() => suspender(p)} className="rounded border border-red-300 bg-red-50 px-3 py-2 font-medium text-red-700 hover:bg-red-100">
                      Suspender estos productos
                    </button>
                  )}
                  <button type="button" onClick={() => { setAResolver(p); setNota('') }} className="rounded border border-green-300 bg-green-50 px-3 py-2 font-medium text-green-700 hover:bg-green-100">
                    Resolver
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {aResolver && (
        <Dialogo titulo="Resolver parte">
          <p className="mb-3 text-gray-600">Podés dejarle una nota al empleado (opcional).</p>
          <label className="mb-1 block font-medium" htmlFor="nota-parte">Nota</label>
          <textarea id="nota-parte" value={nota} onChange={(e) => setNota(e.target.value)} maxLength={200} rows={3} className={campoClase} placeholder="Ej: ya vino el técnico" />
          <p className="text-right text-xs text-gray-500">{nota.length}/200</p>
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={() => setAResolver(null)} disabled={enviando} className="rounded border px-4 py-2">Cancelar</button>
            <button type="button" onClick={resolver} disabled={enviando} className="rounded border border-black bg-action px-4 py-2 text-white hover:bg-action-hover disabled:opacity-50">
              {enviando ? 'Guardando...' : 'Resolver'}
            </button>
          </div>
        </Dialogo>
      )}
    </main>
  )
}
