import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { esEmailValido } from '../utils/validaciones'
import ErrorAlert from '../components/ErrorAlert'
import CampoPassword from '../components/CampoPassword'
import AuthLayout from '../components/auth/AuthLayout'
import BotonEnviar from '../components/ui/BotonEnviar'
import { CLASE_INPUT, CLASE_LABEL } from '../components/ui/formulario'

function Login() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const estado = location.state as { from?: string; mensaje?: string; email?: string } | null
  const from = estado?.from ?? '/'
  const [email, setEmail] = useState(estado?.email ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('El email es obligatorio')
      return
    }
    if (!esEmailValido(email)) {
      setError('El email no tiene un formato válido')
      return
    }
    if (!password) {
      setError('La contraseña es obligatoria')
      return
    }

    try {
      await login({ email, password })
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    }
  }

  return (
    <AuthLayout
      titulo="Iniciar sesión"
      subtitulo="Ingresá tus datos para continuar con tu pedido."
      pie={
        <>
          ¿No tenés cuenta?{' '}
          <Link to="/registro" state={{ from }} className="font-bold text-brand-red hover:underline">
            Registrate
          </Link>
        </>
      }
    >
      {estado?.mensaje && (
        <p className="mb-5 rounded-2xl border-2 border-brand-mustard bg-brand-cream px-4 py-3 text-sm font-bold">
          {estado.mensaje}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
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
            onChange={(e) => setEmail(e.target.value)}
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tu contraseña"
            autoComplete="current-password"
            className={CLASE_INPUT}
          />
        </div>

        <ErrorAlert message={error} />
        <BotonEnviar cargando={loading} texto="Ingresar" textoCargando="Ingresando..." />
      </form>
    </AuthLayout>
  )
}

export default Login