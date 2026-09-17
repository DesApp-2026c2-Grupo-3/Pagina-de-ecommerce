import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { getPerfil, actualizarPerfil } from '../services/userService'
import type { User } from '../types/user'
import ErrorAlert from '../components/ErrorAlert'
import { esEmailValido } from '../utils/validaciones'

function Perfil() {
  const { user, setUser } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [direccion, setDireccion] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (!user) return

    getPerfil(user.id)
      .then((data: User) => {
        setName(data.name)
        setEmail(data.email)
        setTelefono(data.telefono ?? '')
        setDireccion(data.direccion ?? '')
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Error al cargar el perfil')
      })
      .finally(() => setLoading(false))
  }, [user])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setSaving(true)
    if (!name.trim()) {
      setError('El nombre es obligatorio')
      return
    }
    if (!esEmailValido(email)) {
      setError('El email no tiene un formato válido')
      return
    }
    if (password && password.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }
    try {
      const updated = await actualizarPerfil(user!.id, {
        name,
        email,
        telefono,
        direccion,
        password: password || undefined,
      })
      setUser(updated)
      setPassword('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el perfil')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-gray-600">Cargando...</div>
    )
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="text-3xl font-extrabold text-brand-dark">Mi perfil</h1>
      <p className="mt-2 text-gray-600">Editá tus datos personales.</p>

        <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-4">
          <div>
          <label htmlFor="name" className="text-sm font-semibold text-brand-dark">
            Nombre
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-dark/20 px-4 py-2 focus:border-brand-red focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="email" className="text-sm font-semibold text-brand-dark">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-dark/20 px-4 py-2 focus:border-brand-red focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="telefono" className="text-sm font-semibold text-brand-dark">
            Teléfono
          </label>
          <input
            id="telefono"
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-dark/20 px-4 py-2 focus:border-brand-red focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="direccion" className="text-sm font-semibold text-brand-dark">
            Dirección
          </label>
          <input
            id="direccion"
            type="text"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-dark/20 px-4 py-2 focus:border-brand-red focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-semibold text-brand-dark">
            Nueva contraseña
          </label>
          <input
            id="password"
            type="password"
            placeholder="Dejar vacío para no cambiarla"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-dark/20 px-4 py-2 focus:border-brand-red focus:outline-none"
          />
        </div>

          <ErrorAlert message={error} />
        {success && (
          <p className="rounded-lg bg-brand-green/10 px-4 py-2 font-semibold text-brand-green">
            ✓ Perfil actualizado
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-2 rounded-full bg-brand-red px-6 py-3 font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}

export default Perfil