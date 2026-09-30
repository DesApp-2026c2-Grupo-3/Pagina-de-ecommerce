import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { getPerfil, actualizarPerfil } from '../services/userService'
import Modal from '../components/Modal'
import ErrorAlert from '../components/ErrorAlert'
import { formatearFecha } from '../utils/fechas'
import {
  hoyEnArgentina,
  validarApellido,
  validarDni,
  validarFechaNacimiento,
  validarNombre,
  validarTelefono,
  fechaLimiteEdad,
} from '../utils/validacionesPerfil'
import type { User } from '../types/user'

type CampoEditable = 'nombre' | 'telefono' | 'fechaNacimiento' | 'dni' | null

const ESTILO_CAMPO =
  'mt-1 w-full border-b border-brand-dark/20 py-2 text-lg focus:border-brand-red focus:outline-none'

interface BotonesModalProps {
  saving: boolean
  onCancelar: () => void
}

function BotonesModal({ saving, onCancelar }: BotonesModalProps) {
  return (
    <div className="mt-2 flex justify-end gap-3">
      <button
        type="button"
        onClick={onCancelar}
        className="rounded-full border border-brand-dark/20 px-5 py-2 font-bold text-brand-dark transition-colors hover:border-brand-red hover:text-brand-red"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-brand-red px-6 py-2 font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {saving ? 'Guardando...' : 'Guardar'}
      </button>
    </div>
  )
}

function Perfil() {
  const { user, setUser } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [datos, setDatos] = useState<User | null>(null)

  const [campoAbierto, setCampoAbierto] = useState<CampoEditable>(null)

  // Valores temporales del formulario dentro del modal
  const [name, setName] = useState('')
  const [apellido, setApellido] = useState('')
  const [telefono, setTelefono] = useState('')
  const [dni, setDni] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')

  useEffect(() => {
    if (!user) return

    getPerfil(user.id)
      .then((data: User) => setDatos(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar el perfil'))
      .finally(() => setLoading(false))
  }, [user])

  function abrirModal(campo: CampoEditable) {
    if (!datos) return
    setName(datos.name)
    setApellido(datos.apellido ?? '')
    setTelefono(datos.telefono ?? '')
    setDni(datos.dni ?? '')
    setFechaNacimiento(datos.fechaNacimiento ?? '')
    setError('')
    setCampoAbierto(campo)
  }

  function cerrarModal() {
    setCampoAbierto(null)
  }

  // Solo se valida el dato que se está editando
  function validarCampo(campo: CampoEditable) {
    switch (campo) {
      case 'nombre':
        return validarNombre(name) || validarApellido(apellido)
      case 'telefono':
        return validarTelefono(telefono)
      case 'dni':
        return validarDni(dni)
      case 'fechaNacimiento':
        return validarFechaNacimiento(fechaNacimiento)
      default:
        return ''
    }
  }

  async function guardarCambios(e: FormEvent) {
    e.preventDefault()
    setError('')

    const errorCampo = validarCampo(campoAbierto)
    if (errorCampo) {
      setError(errorCampo)
      return
    }

    setSaving(true)
    try {
      const updated = await actualizarPerfil(user!.id, {
        name: name.trim(),
        apellido: apellido.trim(),
        email: datos!.email,
        telefono: telefono.trim(),
        dni: dni.trim().replace(/\./g, ''),
        fechaNacimiento,
      })
      setDatos(updated)
      setUser(updated)
      cerrarModal()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el perfil')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !datos) {
    return <div className="mx-auto max-w-md px-4 py-16 text-center text-gray-600">Cargando...</div>
  }

  const filas = [
    {
      campo: 'nombre' as const,
      icono: '👤',
      titulo: 'Nombre y apellido',
      valor: [datos.name, datos.apellido].filter(Boolean).join(' ') || 'Datos no proporcionados',
    },
    {
      campo: 'telefono' as const,
      icono: '📱',
      titulo: 'Teléfono',
      valor: datos.telefono || 'Datos no proporcionados',
    },
    {
      campo: 'fechaNacimiento' as const,
      icono: '🎂',
      titulo: 'Fecha de nacimiento',
      valor: formatearFecha(datos.fechaNacimiento) || 'Datos no proporcionados',
    },
    {
      campo: 'dni' as const,
      icono: '🪪',
      titulo: 'Documento de identidad',
      valor: datos.dni || 'Datos no proporcionados',
    },
  ]

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-extrabold text-brand-dark">Datos personales</h1>

      <div className="mt-8 divide-y divide-brand-dark/10 rounded-2xl bg-white shadow-md">
        {filas.map((fila) => (
          <button
            key={fila.campo}
            type="button"
            onClick={() => abrirModal(fila.campo)}
            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-brand-cream"
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">{fila.icono}</span>
              <div>
                <p className="font-semibold text-brand-dark">{fila.titulo}</p>
                <p
                  className={`text-sm ${
                    fila.valor === 'Datos no proporcionados' ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {fila.valor}
                </p>
              </div>
            </div>
            <span className="text-xl text-brand-dark/40">›</span>
          </button>
        ))}
      </div>

      {/* Nombre y apellido: dos campos, lado a lado en pantallas grandes */}
      <Modal
        isOpen={campoAbierto === 'nombre'}
        onClose={cerrarModal}
        title="Nombre y apellido"
        subtitle="¿Cómo querés que te llamemos?"
      >
        <form onSubmit={guardarCambios} noValidate className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nombre" className="text-sm text-gray-500">
                Nombre
              </label>
              <input
                id="nombre"
                type="text"
                autoFocus
                maxLength={20}
                autoComplete="given-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Juan"
                className={ESTILO_CAMPO}
              />
            </div>
            <div>
              <label htmlFor="apellido" className="text-sm text-gray-500">
                Apellido
              </label>
              <input
                id="apellido"
                type="text"
                maxLength={20}
                autoComplete="family-name"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                placeholder="Ej: Pérez"
                className={ESTILO_CAMPO}
              />
            </div>
          </div>
          <ErrorAlert message={error} />
          <BotonesModal saving={saving} onCancelar={cerrarModal} />
        </form>
      </Modal>

      {/* Teléfono: un solo dato, modal chico y teclado de teléfono */}
      <Modal
        isOpen={campoAbierto === 'telefono'}
        onClose={cerrarModal}
        title="Teléfono"
        subtitle="Lo usamos para avisarte sobre tus pedidos."
        tamanio="sm"
      >
        <form onSubmit={guardarCambios} noValidate className="flex flex-col gap-4">
          <div>
            <label htmlFor="telefono" className="text-sm text-gray-500">
              Número con código de área
            </label>
            <input
              id="telefono"
              type="tel"
              inputMode="tel"
              autoFocus
              maxLength={20}
              autoComplete="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej: 11 1234-5678"
              className={ESTILO_CAMPO}
            />
          </div>
          <ErrorAlert message={error} />
          <BotonesModal saving={saving} onCancelar={cerrarModal} />
        </form>
      </Modal>

      {/* Fecha de nacimiento: no se puede elegir una fecha futura */}
      <Modal
        isOpen={campoAbierto === 'fechaNacimiento'}
        onClose={cerrarModal}
        title="Fecha de nacimiento"
        subtitle="Para saludarte en tu cumpleaños 🎂"
        tamanio="sm"
      >
        <form onSubmit={guardarCambios} noValidate className="flex flex-col gap-4">
          <div>
            <label htmlFor="fechaNacimiento" className="text-sm text-gray-500">
              Fecha
            </label>
            <input
              id="fechaNacimiento"
              type="date"
              autoFocus
              min="1900-01-01"
              max={fechaLimiteEdad()}
              autoComplete="bday"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
              className={ESTILO_CAMPO}
            />
          </div>
          <ErrorAlert message={error} />
          <BotonesModal saving={saving} onCancelar={cerrarModal} />
        </form>
      </Modal>

      {/* DNI: teclado numérico, se aceptan los puntos */}
      <Modal
        isOpen={campoAbierto === 'dni'}
        onClose={cerrarModal}
        title="Documento de identidad"
        subtitle="Lo pedimos para validar tus compras."
        tamanio="sm"
      >
        <form onSubmit={guardarCambios} noValidate className="flex flex-col gap-4">
          <div>
            <label htmlFor="dni" className="text-sm text-gray-500">
              Número de DNI
            </label>
            <input
              id="dni"
              type="text"
              inputMode="numeric"
              autoFocus
              maxLength={10}
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              placeholder="Ej: 30123456"
              className={ESTILO_CAMPO}
            />
          </div>
          <ErrorAlert message={error} />
          <BotonesModal saving={saving} onCancelar={cerrarModal} />
        </form>
      </Modal>
    </div>
  )
}

export default Perfil