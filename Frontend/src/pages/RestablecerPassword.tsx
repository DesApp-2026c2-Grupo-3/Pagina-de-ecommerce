
import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ErrorAlert from '../components/ErrorAlert'
import CampoPassword from '../components/CampoPassword'
import AuthLayout from '../components/auth/AuthLayout'
import BotonEnviar from '../components/ui/BotonEnviar'
import { CLASE_INPUT, CLASE_LABEL } from '../components/ui/formulario'
import { restablecerPassword } from '../services/authService'

function RestablecerPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setMensaje('')

    if (!token) {
      setError('El enlace de recuperación no contiene un token válido.')
      return
    }

    if (password.length < 6 || password.length > 20 || !/\S/.test(password)) {
      setError('La contraseña debe tener entre 6 y 20 caracteres y no puede contener solo espacios.')
      return
    }

    try {
      setLoading(true)
      const respuesta = await restablecerPassword(token, password)
      setMensaje(respuesta)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo restablecer la contraseña.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      titulo="Nueva contraseña"
      subtitulo="Ingresá la nueva contraseña de tu cuenta."
      pie={
        <Link to="/login" className="font-bold text-brand-red hover:underline">
          Volver a iniciar sesión
        </Link>
      }
    >
      {mensaje ? (
        <div className="flex flex-col gap-4">
          <p role="status" className="rounded-2xl border-2 border-brand-mustard bg-brand-cream px-4 py-3 text-sm font-bold">
            {mensaje}
          </p>
          <Link to="/login" className="text-center font-bold text-brand-red hover:underline">
            Iniciar sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div>
            <label htmlFor="password" className={CLASE_LABEL}>
              Nueva contraseña
            </label>
            <CampoPassword
              id="password"
              required
              minLength={6}
              maxLength={20}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entre 6 y 20 caracteres"
              autoComplete="new-password"
              className={CLASE_INPUT}
            />
          </div>

          <ErrorAlert message={error} />

          <BotonEnviar
            cargando={loading}
            texto="Cambiar contraseña"
            textoCargando="Cambiando contraseña..."
          />
        </form>
      )}
    </AuthLayout>
  )
}

export default RestablecerPassword
