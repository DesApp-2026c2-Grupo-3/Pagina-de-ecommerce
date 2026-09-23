import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { getPerfil, actualizarPerfil } from '../services/userService'
import Modal from '../components/Modal'
import ErrorAlert from '../components/ErrorAlert'
import { esEmailValido } from '../utils/validaciones'
import type { User } from '../types/user'

type CampoEditable = 'email' | 'password' | null

function Seguridad() {
  const { user, setUser } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [datos, setDatos] = useState<User | null>(null)

  const [campoAbierto, setCampoAbierto] = useState<CampoEditable>(null)

  const [email, setEmail] = useState('')
  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')

  useEffect(() => {
    if (!user) return

    getPerfil(user.id)
      .then((data: User) => setDatos(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar los datos'))
      .finally(() => setLoading(false))
  }, [user])

  function abrirModal(campo: CampoEditable) {
    if (!datos) return
    setEmail(datos.email)
    setPasswordActual('')
    setPasswordNueva('')
    setError('')
    setCampoAbierto(campo)
  }

  async function guardarEmail(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!esEmailValido(email)) {
      setError('El email no tiene un formato válido')
      return
    }

    setSaving(true)
    try {
      const updated = await actualizarPerfil(user!.id, {
        name: datos!.name,
        apellido: datos!.apellido,
        email,
        telefono: datos!.telefono,
        dni: datos!.dni,
        fechaNacimiento: datos!.fechaNacimiento,
      })
      setDatos(updated)
      setUser(updated)
      setCampoAbierto(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el email')
    } finally {
      setSaving(false)
    }
  }

 async function guardarPassword(e: FormEvent) {
  e.preventDefault()
  setError('')

  if (!passwordActual) {
    setError('Ingresá tu contraseña actual')
    return
  }
  if (passwordNueva.length < 6) {
    setError('La nueva contraseña debe tener al menos 6 caracteres')
    return
  }
console.log('Mandando:', { passwordActual, passwordNueva })
  setSaving(true)
  try {
    const updated = await actualizarPerfil(user!.id, {
      name: datos!.name,
      apellido: datos!.apellido,
      email: datos!.email,
      telefono: datos!.telefono,
      dni: datos!.dni,
      fechaNacimiento: datos!.fechaNacimiento,
      password: passwordNueva,
      passwordActual,
    })
    setDatos(updated)
    setUser(updated)
    setCampoAbierto(null)
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Error al actualizar la contraseña')
  } finally {
    setSaving(false)
  }
}

  if (loading || !datos) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-gray-600">Cargando...</div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-extrabold text-brand-dark">Inicio de sesión y seguridad</h1>

      <div className="mt-8 divide-y divide-brand-dark/10 rounded-2xl bg-white shadow-md">
        <button
          type="button"
          onClick={() => abrirModal('email')}
          className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-brand-cream"
        >
          <div className="flex items-center gap-4">
            <span className="text-2xl">📧</span>
            <div>
              <p className="font-semibold text-brand-dark">Email</p>
              <p className="text-sm text-gray-600">{datos.email}</p>
            </div>
          </div>
          <span className="text-xl text-brand-dark/40">›</span>
        </button>

        <button
          type="button"
          onClick={() => abrirModal('password')}
          className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-brand-cream"
        >
          <div className="flex items-center gap-4">
            <span className="text-2xl">🔑</span>
            <div>
              <p className="font-semibold text-brand-dark">Contraseña</p>
              <p className="text-sm text-gray-600">••••••••</p>
            </div>
          </div>
          <span className="text-xl text-brand-dark/40">›</span>
        </button>
      </div>

      {/* Modal: Email */}
      <Modal
        isOpen={campoAbierto === 'email'}
        onClose={() => setCampoAbierto(null)}
        title="Email"
        subtitle="Usamos tu email para que inicies sesión y te contactemos sobre tus pedidos."
      >
        <form onSubmit={guardarEmail} noValidate className="flex flex-col gap-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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

      {/* Modal: Contraseña */}
      <Modal
        isOpen={campoAbierto === 'password'}
        onClose={() => setCampoAbierto(null)}
        title="Cambiar contraseña"
      >
        <form onSubmit={guardarPassword} noValidate className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-gray-500">Contraseña actual</label>
            <input
              type="password"
              value={passwordActual}
              onChange={(e) => setPasswordActual(e.target.value)}
              className="mt-1 w-full border-b border-brand-dark/20 py-2 text-lg focus:border-brand-red focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-gray-500">Nueva contraseña</label>
            <input
              type="password"
              value={passwordNueva}
              onChange={(e) => setPasswordNueva(e.target.value)}
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
    </div>
  )
}

export default Seguridad