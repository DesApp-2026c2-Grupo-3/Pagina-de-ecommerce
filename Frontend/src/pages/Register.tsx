import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ErrorAlert from '../components/ErrorAlert'
import { esEmailValido } from '../utils/validaciones'
import CampoPassword from '../components/CampoPassword'
import AuthLayout from '../components/auth/AuthLayout'
import BotonEnviar from '../components/ui/BotonEnviar'
import { CLASE_INPUT, CLASE_LABEL } from '../components/ui/formulario'

const ESTILOS = {
  pieContenedor: 'relative flex flex-col gap-2 pb-16',
  linkAccion: 'font-bold text-brand-red hover:underline',
  errorReserva: 'absolute inset-x-0 top-8',
  formulario: 'flex flex-col gap-4',
} as const


function Register() {
  const { register, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

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
      const mensaje = await register({ name, email, password })
      navigate('/login', { state: { from, mensaje, email } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse')
    }
  }

  return (
    <AuthLayout
      titulo="Crear cuenta"
      subtitulo="Registrate para poder confirmar tus pedidos."
      pie={
        <div className={ESTILOS.pieContenedor}>
          <div>
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" state={{ from }} className={ESTILOS.linkAccion}>
              Iniciar sesión
            </Link>
          </div>

          <div className={ESTILOS.errorReserva}>
            {error && <ErrorAlert message={error} />}
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} noValidate className={ESTILOS.formulario}>
        <div>
          <label htmlFor="name" className={CLASE_LABEL}>
            Nombre
          </label>
          <input
            id="name"
            type="text"
            required
            autoComplete="given-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (error) setError('')
            }}
            placeholder="Ej: Juan"
            className={CLASE_INPUT}
          />
        </div>

        <div>
          <label htmlFor="email" className={CLASE_LABEL}>
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (error) setError('')
            }}
            placeholder="tu@email.com"
            className={CLASE_INPUT}
          />
        </div>

        <div>
          <label htmlFor="password" className={CLASE_LABEL}>
            Contraseña
          </label>
          <CampoPassword
            id="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (error) setError('')
            }}
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
            className={CLASE_INPUT}
          />
        </div>

        <BotonEnviar cargando={loading} texto="Crear cuenta" textoCargando="Creando cuenta..." />
      </form>
    </AuthLayout>
  )
}

export default Register
