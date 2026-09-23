import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import ErrorAlert from '../components/ErrorAlert'
import { esEmailValido } from '../utils/validaciones'

function Register() {
  const { register, loading } = useAuth()
  const { clearCart } = useCart()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) {
      setError('El nombre es obligatorio')
      return
    }
    if (!esEmailValido(email)) {
      setError('El email no tiene un formato válido')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    try {
      await register({ name, email, password })
      clearCart()
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse')
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="text-3xl font-extrabold text-brand-dark">Crear cuenta</h1>
      <p className="mt-2 text-gray-600">Registrate para poder confirmar tus pedidos.</p>

        <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-4">        <div>
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
          <label htmlFor="password" className="text-sm font-semibold text-brand-dark">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-dark/20 px-4 py-2 focus:border-brand-red focus:outline-none"
          />
        </div>

          <ErrorAlert message={error} />
        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-full bg-brand-red px-6 py-3 font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        ¿Ya tenés cuenta?{' '}
        <Link to="/login" className="font-semibold text-brand-red hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </div>
  )
}

export default Register