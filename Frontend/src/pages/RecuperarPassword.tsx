
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import ErrorAlert from '../components/ErrorAlert'
import AuthLayout from '../components/auth/AuthLayout'
import BotonEnviar from '../components/ui/BotonEnviar'
import { CLASE_INPUT, CLASE_LABEL } from '../components/ui/formulario'
import { esEmailValido } from '../utils/validaciones'
import { solicitarRecuperacion } from '../services/authService'

function RecuperarPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setMensaje('')

    if (!esEmailValido(email)) {
      setError('El email no tiene un formato válido')
      return
    }

    try {
      setLoading(true)
      const respuesta = await solicitarRecuperacion(email)
      setMensaje(respuesta)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo procesar la solicitud. Intentá nuevamente.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      titulo="Recuperar contraseña"
      subtitulo="Ingresá tu email para recibir instrucciones para recuperar tu cuenta."
      pie={
        <Link to="/login" className="font-bold text-brand-red hover:underline">
          Volver a iniciar sesión
        </Link>
      }
    >
      {mensaje ? (
        <p
          role="status"
          className="rounded-2xl border-2 border-brand-mustard bg-brand-cream px-4 py-3 text-sm font-bold"
        >
          {mensaje}
        </p>
      ) : (
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

          <ErrorAlert message={error} />

          <BotonEnviar
            cargando={loading}
            texto="Solicitar recuperación"
            textoCargando="Enviando solicitud..."
          />
        </form>
      )}
    </AuthLayout>
  )
}

export default RecuperarPassword
