import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { getPerfil, actualizarPerfil } from '../services/userService'
import Modal from '../components/Modal'
import ErrorAlert from '../components/ErrorAlert'
import { esEmailValido } from '../utils/validaciones'
import type { User } from '../types/user'

type CampoEditable = 'nombre' | 'telefono' | 'fechaNacimiento' | 'dni' | 'email' | 'password' | null

function Perfil() {
  const { user, setUser } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [datos, setDatos] = useState<User | null>(null)

  const [campoAbierto, setCampoAbierto] = useState<CampoEditable>(null)

  // valores temporales del form dentro del modal
  const [name, setName] = useState('')
  const [apellido, setApellido] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [dni, setDni] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [password, setPassword] = useState('')

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
    setEmail(datos.email)
    setTelefono(datos.telefono ?? '')
    setDni(datos.dni ?? '')
    setFechaNacimiento(datos.fechaNacimiento ?? '')
    setPassword('')
    setError('')
    setCampoAbierto(campo)
  }

  async function guardarCambios(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!esEmailValido(email)) {
      setError('El email no tiene un formato válido')
      return
    }
    if (password && password.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }

    setSaving(true)
    try {
      const updated = await actualizarPerfil(user!.id, {
        name,
        apellido,
        email,
        telefono,
        dni,
        fechaNacimiento,
        password: password || undefined,
      })
      setDatos(updated)
      setUser(updated)
      setCampoAbierto(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el perfil')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !datos) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-gray-600">Cargando...</div>
    )
  }

  const filas = [
    {
      campo: 'nombre' as const,
      icono: '👤',
      titulo: 'Nombre y Apellido',
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
      valor: datos.fechaNacimiento || 'Datos no proporcionados',
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

      {/* Modal: Nombre y Apellido */}
      <Modal
        isOpen={campoAbierto === 'nombre'}
        onClose={() => setCampoAbierto(null)}
        title="Nombre y Apellido"
        subtitle="¿Cómo quisieras que te llamemos?"
      >
        <form onSubmit={guardarCambios} noValidate className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-gray-500">Nombre</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full border-b border-brand-dark/20 py-2 text-lg focus:border-brand-red focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-gray-500">Apellido</label>
            <input
              type="text"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              className="mt-1 w-full border-b border-brand-dark/20 py-2 text-lg focus:border-brand-red focus:outline-none"
            />
          </div>
          <ErrorAlert message={error} />
          <button
            type="submit"
            disabled={saving}
            className="mt-2 self-end rounded-full bg-brand-red px-6 py-2 font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      </Modal>

      {/* Modal: Teléfono */}
      <Modal
        isOpen={campoAbierto === 'telefono'}
        onClose={() => setCampoAbierto(null)}
        title="Teléfono"
      >
        <form onSubmit={guardarCambios} noValidate className="flex flex-col gap-4">
          <input
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="w-full border-b border-brand-dark/20 py-2 text-lg focus:border-brand-red focus:outline-none"
          />
          <ErrorAlert message={error} />
          <button
            type="submit"
            disabled={saving}
            className="mt-2 self-end rounded-full bg-brand-red px-6 py-2 font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      </Modal>

      {/* Modal: Fecha de nacimiento */}
      <Modal
        isOpen={campoAbierto === 'fechaNacimiento'}
        onClose={() => setCampoAbierto(null)}
        title="Fecha de nacimiento"
      >
        <form onSubmit={guardarCambios} noValidate className="flex flex-col gap-4">
          <input
            type="date"
            value={fechaNacimiento}
            onChange={(e) => setFechaNacimiento(e.target.value)}
            className="w-full border-b border-brand-dark/20 py-2 text-lg focus:border-brand-red focus:outline-none"
          />
          <ErrorAlert message={error} />
          <button
            type="submit"
            disabled={saving}
            className="mt-2 self-end rounded-full bg-brand-red px-6 py-2 font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      </Modal>

      {/* Modal: DNI */}
      <Modal
        isOpen={campoAbierto === 'dni'}
        onClose={() => setCampoAbierto(null)}
        title="Documento de identidad"
      >
        <form onSubmit={guardarCambios} noValidate className="flex flex-col gap-4">
          <input
            type="text"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            className="w-full border-b border-brand-dark/20 py-2 text-lg focus:border-brand-red focus:outline-none"
          />
          <ErrorAlert message={error} />
          <button
            type="submit"
            disabled={saving}
            className="mt-2 self-end rounded-full bg-brand-red px-6 py-2 font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      </Modal>
    </div>
  )
}

export default Perfil