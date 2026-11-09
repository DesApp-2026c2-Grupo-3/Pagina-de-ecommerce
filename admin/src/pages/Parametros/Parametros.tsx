import { useEffect, useState, type FormEvent } from 'react'
import { useToast } from '../../context/ToastContext'
import { guardarParametros, obtenerParametros } from '../../services/parametroService'
import type { Parametros as ParametrosNegocio } from '../../types/parametros.types'

type Clave = keyof ParametrosNegocio

interface Campo {
  clave: Clave
  etiqueta: string
  ayuda: string
  unidad: string
  min: number
  max: number
  paso: number
}

// Los mismos rangos que valida el backend (schemas/admin/parametros.schema.js)
const SECCIONES: { titulo: string; descripcion: string; campos: Campo[] }[] = [
  {
    titulo: 'Pedidos',
    descripcion: 'Reglas al hacer un pedido.',
    campos: [
      { clave: 'maxPedidosEnCurso', etiqueta: 'Pedidos en curso por cliente', ayuda: 'Cuántos pedidos sin entregar puede tener un cliente a la vez.', unidad: 'pedidos', min: 1, max: 10, paso: 1 },
    ],
  },
  {
    titulo: 'Entrega',
    descripcion: 'Hasta dónde se entrega y cuánto se cobra el envío: base + distancia × precio por km.',
    campos: [
      { clave: 'radioEntregaKm', etiqueta: 'Radio de entrega', ayuda: 'Distancia máxima (en línea recta) desde la sucursal. Vale para todas las sucursales.', unidad: 'km', min: 1, max: 30, paso: 0.5 },
      { clave: 'envioBase', etiqueta: 'Envío base', ayuda: 'Lo mínimo que se cobra de envío.', unidad: '$', min: 0, max: 100000, paso: 50 },
      { clave: 'envioPorKm', etiqueta: 'Envío por km', ayuda: 'Se suma por cada km de distancia. En 0, el envío es fijo.', unidad: '$', min: 0, max: 100000, paso: 50 },
    ],
  },
  {
    titulo: 'Tiempos de entrega',
    descripcion: 'Con esto se calcula el tiempo estimado: preparación (base + por producto) + viaje (distancia × minutos por km).',
    campos: [
      { clave: 'preparacionBaseMin', etiqueta: 'Preparación base', ayuda: 'Lo que tarda cualquier pedido, aunque sea de un producto.', unidad: 'min', min: 0, max: 180, paso: 1 },
      { clave: 'preparacionPorProductoMin', etiqueta: 'Preparación por producto', ayuda: 'Se suma por cada unidad del pedido.', unidad: 'min', min: 0, max: 60, paso: 1 },
      { clave: 'viajeMinPorKm', etiqueta: 'Viaje por km', ayuda: 'Cuánto tarda el repartidor por cada km.', unidad: 'min', min: 0.5, max: 30, paso: 0.5 },
      { clave: 'margenDemoraMin', etiqueta: 'Margen si hay demora', ayuda: 'Si una etapa se atrasa, la hora estimada se corre este tiempo.', unidad: 'min', min: 1, max: 60, paso: 1 },
    ],
  },
  {
    titulo: 'Calificaciones',
    descripcion: 'Opiniones de los clientes.',
    campos: [
      { clave: 'diasParaCalificar', etiqueta: 'Días para calificar', ayuda: 'Hasta cuántos días después del pedido se puede calificar.', unidad: 'días', min: 1, max: 60, paso: 1 },
      { clave: 'opinionesEnInicio', etiqueta: 'Opiniones en el inicio', ayuda: 'Cuántas opiniones aprobadas se muestran en la tienda (0 = ninguna).', unidad: 'opiniones', min: 0, max: 24, paso: 1 },
    ],
  },
  {
    titulo: 'Promociones',
    descripcion: 'Límites de las promos.',
    campos: [
      { clave: 'maxPromosPorDia', etiqueta: 'Promos activas por día', ayuda: 'Cuántas promos del día puede haber activas un mismo día.', unidad: 'promos', min: 1, max: 10, paso: 1 },
    ],
  },
]

const CAMPOS = SECCIONES.flatMap((s) => s.campos)

// El formulario maneja texto (lo que se escribe en los inputs)
type Formulario = Record<Clave, string>

const aFormulario = (p: ParametrosNegocio): Formulario =>
  Object.fromEntries(CAMPOS.map((c) => [c.clave, String(p[c.clave])])) as Formulario

const campo = 'w-full rounded border bg-white p-2 text-right'

// Parámetros del negocio (solo el master): antes estaban escritos en el código
export default function Parametros() {
  const { mostrarToast } = useToast()
  const [original, setOriginal] = useState<Formulario | null>(null)
  const [form, setForm] = useState<Formulario | null>(null)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    obtenerParametros()
      .then((p) => {
        setOriginal(aFormulario(p))
        setForm(aFormulario(p))
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar los parámetros'))
  }, [])

  if (!form || !original) {
    return (
      <main className="p-8">
        <h1 className="text-3xl font-bold">Parámetros</h1>
        <p className="mt-4 text-gray-600">{error || 'Cargando...'}</p>
      </main>
    )
  }

  const hayCambios = CAMPOS.some((c) => form[c.clave] !== original[c.clave])
  const n = (clave: Clave) => Number(form[clave])

  // Ejemplo en vivo, con las mismas cuentas que hace el backend (utils/entrega.js)
  const ejemplo = {
    envio: Math.round(n('envioBase') + 3 * n('envioPorKm')),
    preparacion: n('preparacionBaseMin') + n('preparacionPorProductoMin') * 3,
    viaje: Math.ceil(3 * n('viajeMinPorKm')),
  }

  function cambiar(clave: Clave, valor: string) {
    setForm((actual) => (actual ? { ...actual, [clave]: valor } : actual))
    setError('')
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    if (!form) return

    // Misma validación que el backend, para avisar antes de enviar
    for (const c of CAMPOS) {
      const valor = form[c.clave]
      const numero = Number(valor)
      if (valor.trim() === '' || !Number.isFinite(numero)) return setError(`Completá "${c.etiqueta}".`)
      if (c.paso === 1 && !Number.isInteger(numero)) return setError(`"${c.etiqueta}" tiene que ser un número entero.`)
      if (numero < c.min || numero > c.max) return setError(`"${c.etiqueta}" tiene que estar entre ${c.min} y ${c.max}.`)
    }

    setGuardando(true)
    try {
      const datos = {} as ParametrosNegocio
      for (const c of CAMPOS) datos[c.clave] = Number(form[c.clave])
      await guardarParametros(datos)
      setOriginal(form)
      mostrarToast('Parámetros guardados!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron guardar los parámetros.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <main className="p-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">Configuración del negocio</p>
        <h1 className="text-3xl font-bold">Parámetros</h1>
        <p className="mt-2 text-gray-600">Los cambios se aplican a los pedidos nuevos desde que guardás.</p>
      </div>

      <form onSubmit={guardar} noValidate className="flex max-w-3xl flex-col gap-5">
        {SECCIONES.map((seccion) => (
          <section key={seccion.titulo} className="rounded-lg border bg-white p-5">
            <h2 className="text-xl font-bold">{seccion.titulo}</h2>
            <p className="mb-4 text-sm text-gray-600">{seccion.descripcion}</p>

            <div className="flex flex-col divide-y">
              {seccion.campos.map((c) => (
                <div key={c.clave} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <label htmlFor={c.clave} className="min-w-0">
                    <span className="block font-medium">{c.etiqueta}</span>
                    <span className="block text-sm text-gray-500">{c.ayuda}</span>
                  </label>
                  <div className="flex shrink-0 items-center gap-2">
                    {c.unidad === '$' && <span className="text-gray-500">$</span>}
                    <input
                      id={c.clave}
                      type="number"
                      min={c.min}
                      max={c.max}
                      step={c.paso}
                      value={form[c.clave]}
                      onChange={(e) => cambiar(c.clave, e.target.value)}
                      className={`${campo} w-28`}
                    />
                    {c.unidad !== '$' && <span className="w-16 text-sm text-gray-500">{c.unidad}</span>}
                  </div>
                </div>
              ))}
            </div>

            {seccion.titulo === 'Tiempos de entrega' && (
              <p className="mt-3 rounded bg-orange-50 p-3 text-sm text-orange-900">
                Ejemplo, 3 productos a 3 km: envío <b>${ejemplo.envio.toLocaleString('es-AR')}</b> y llega en unos{' '}
                <b>{ejemplo.preparacion + ejemplo.viaje} min</b> ({ejemplo.preparacion} de preparación + {ejemplo.viaje} de viaje).
              </p>
            )}
          </section>
        ))}

        {error && <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => { setForm(original); setError('') }}
            disabled={!hayCambios || guardando}
            className="rounded border px-4 py-2 transition-colors hover:bg-gray-50 disabled:opacity-40"
          >
            Descartar cambios
          </button>
          <button
            type="submit"
            disabled={!hayCambios || guardando}
            className="rounded border border-orange-300 bg-action px-4 py-2 text-white transition-colors hover:bg-action-hover disabled:opacity-40"
          >
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </main>
  )
}