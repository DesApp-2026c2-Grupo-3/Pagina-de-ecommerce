import { useEffect, useState } from 'react'
import EditorHorario from '../../components/EditorHorario'
import TarjetaCierre from '../../components/TarjetaCierre'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { actualizarHorarioSucursal, obtenerSucursalPorId } from '../../services/sucursalService'
import {
  DIAS_SEMANA,
  type DiaSemana,
  type HorarioDia,
  type HorarioSemana,
  type Sucursal,
} from '../../types/sucursal.types'
import { ETIQUETA_DIA, formatearDia, normalizarHorario, validarHorario } from '../../utils/horario'
import { horarioParaEnviar } from '../../utils/sucursalForm'

const filaClase = 'flex flex-col gap-1 border-b border-gray-200 py-3 last:border-b-0 sm:flex-row sm:gap-4'
const etiquetaClase = 'font-medium text-gray-700 sm:w-48 sm:shrink-0'
const tarjetaClase = 'max-w-3xl rounded-lg border bg-white p-4 shadow-sm md:p-6'

// Datos de la sucursal del encargado: solo lectura. Los edita el administrador general.
// El horario es la excepción: el encargado lo edita si el administrador general lo habilitó
// para su sucursal (perilla en Sucursales); si no, lo ve en solo lectura.
export default function MiSucursal() {
  const { administrador } = useAuth()
  const { mostrarToast } = useToast()
  const sucursalId = administrador?.sucursalId
  const [sucursal, setSucursal] = useState<Sucursal | null>(null)
  const [horarioEditable, setHorarioEditable] = useState<HorarioSemana | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  function aplicarSucursal(s: Sucursal) {
    setSucursal(s)
    setHorarioEditable(normalizarHorario(s.horario))
  }

  useEffect(() => {
    if (!sucursalId) return
    obtenerSucursalPorId(sucursalId)
      .then(aplicarSucursal)
      .catch(() => setError('No se pudo cargar la sucursal.'))
  }, [sucursalId])

  if (!sucursalId) {
    return (
      <main className="p-4 md:p-8">
        <h1 className="mb-6 text-3xl font-bold">Mi sucursal</h1>
        <p className="text-gray-600">
          {administrador?.rol === 'MASTER'
            ? 'El administrador general no tiene una sucursal asignada: las sucursales se gestionan desde Sucursales.'
            : 'No tenés una sucursal asignada. Pedile al administrador general que te asigne una.'}
        </p>
      </main>
    )
  }

  const puedeEditarHorario = administrador?.rol === 'ADMIN' && sucursal?.encargadoEditaHorario !== false

  const direccion = sucursal
    ? [[sucursal.calle, sucursal.numero].filter(Boolean).join(' '), sucursal.localidad, sucursal.provincia]
        .filter(Boolean)
        .join(', ')
    : ''
  const horarioActual = sucursal ? normalizarHorario(sucursal.horario) : null

  function cambiarDia(dia: DiaSemana, valor: HorarioDia) {
    setHorarioEditable((prev) => (prev ? { ...prev, [dia]: valor } : prev))
  }

  async function guardarHorario() {
    if (!sucursalId || !horarioEditable) return

    const errorHorario = validarHorario(horarioEditable)
    if (errorHorario) {
      mostrarToast(errorHorario)
      return
    }

    setGuardando(true)
    try {
      // Un día cerrado no lleva transnoche: se limpia antes de enviar
      const respuesta = await actualizarHorarioSucursal(sucursalId, horarioParaEnviar(horarioEditable))
      setSucursal((prev) => (prev ? { ...prev, horario: respuesta.sucursal.horario } : prev))
      mostrarToast('Horario actualizado')
    } catch (e) {
      mostrarToast(e instanceof Error ? e.message : 'No se pudo guardar el horario')
      // Puede que el administrador general haya apagado la perilla: se vuelve a leer el estado
      obtenerSucursalPorId(sucursalId)
        .then(aplicarSucursal)
        .catch(() => {})
    } finally {
      setGuardando(false)
    }
  }

  return (
    <main className="p-4 md:p-8">
      <h1 className="text-3xl font-bold">Mi sucursal</h1>
      <p className="mt-2 mb-6 text-gray-600">
        {puedeEditarHorario
          ? 'Podés editar el horario de tu sucursal. El resto de los datos los administra el administrador general.'
          : 'Los datos de tu sucursal los administra el administrador general.'}
      </p>

      <TarjetaCierre sucursalId={sucursalId} />

      {error && <p className="text-red-600">{error}</p>}
      {!sucursal && !error && <p className="text-gray-600">Cargando...</p>}

      {sucursal && (
        <div className="flex flex-col gap-6">
          <section className={tarjetaClase}>
            <div className={filaClase}>
              <span className={etiquetaClase}>Sucursal</span>
              <span className="break-words">{sucursal.nombre}</span>
            </div>
            <div className={filaClase}>
              <span className={etiquetaClase}>Estado</span>
              <span>{sucursal.activa ? 'Activa' : 'Inactiva (no recibe pedidos)'}</span>
            </div>
            <div className={filaClase}>
              <span className={etiquetaClase}>Dirección</span>
              <span className="break-words">{direccion || 'Sin cargar'}</span>
            </div>
            <div className={filaClase}>
              <span className={etiquetaClase}>Teléfono</span>
              <span>{sucursal.telefono || 'Sin cargar'}</span>
            </div>
            {sucursal.radioEntregaKm != null && (
              <div className={filaClase}>
                <span className={etiquetaClase}>Radio de entrega</span>
                <span>{Number(sucursal.radioEntregaKm)} km</span>
              </div>
            )}
          </section>

          <section className={tarjetaClase}>
            <h2 className="mb-4 text-xl font-semibold">Horario de atención</h2>

            {puedeEditarHorario && horarioEditable ? (
              <div className="flex flex-col gap-4">
                <EditorHorario horario={horarioEditable} onCambiarDia={cambiarDia} />

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={guardarHorario}
                    disabled={guardando}
                    className="rounded-lg bg-action px-5 py-2 font-semibold text-white hover:bg-action-hover disabled:opacity-60"
                  >
                    {guardando ? 'Guardando...' : 'Guardar horario'}
                  </button>
                </div>
              </div>
            ) : (
              horarioActual && (
                <ul className="flex flex-col gap-1">
                  {DIAS_SEMANA.map((dia) => (
                    <li key={dia}>
                      <span className="inline-block w-28 text-gray-700">{ETIQUETA_DIA[dia]}</span>
                      {horarioActual[dia].abierto ? formatearDia(horarioActual[dia]) : 'Cerrado'}
                    </li>
                  ))}
                </ul>
              )
            )}
          </section>
        </div>
      )}
    </main>
  )
}
