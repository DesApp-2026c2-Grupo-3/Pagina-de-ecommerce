import { useEffect, useState, type FormEvent } from 'react'
import { KeyRound, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getPerfil, actualizarPerfil } from '../services/userService'
import Modal from '../components/Modal'
import ErrorAlert from '../components/ErrorAlert'
import CampoPassword from '../components/CampoPassword'
import AccountLayout from '../components/cuenta/AccountLayout'
import FilaDato from '../components/cuenta/FilaDato'
import BotonesModal from '../components/ui/BotonesModal'
import { CLASE_INPUT, CLASE_LABEL } from '../components/ui/formulario'
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

  function cerrarModal() {
    setCampoAbierto(null)
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
      cerrarModal()
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
      cerrarModal()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la contraseña')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AccountLayout
      titulo="Inicio de sesión y seguridad"
      subtitulo="Con estos datos entrás a tu cuenta."
      cargando={loading || !datos}
    >
      <div className="overflow-hidden rounded-[1.75rem] border-2 border-brand-dark bg-white">
        <FilaDato Icono={Mail} titulo="Email" valor={datos?.email} onClick={() => abrirModal('email')} />
        <FilaDato
          Icono={KeyRound}
          titulo="Contraseña"
          valor="••••••••"
          color="rojo"
          onClick={() => abrirModal('password')}
        />
      </div>

      {/* Modal: Email */}
      <Modal
        isOpen={campoAbierto === 'email'}
        onClose={cerrarModal}
        title="Email"
        subtitle="Usamos tu email para que inicies sesión y te contactemos sobre tus pedidos."
      >
        <form onSubmit={guardarEmail} noValidate className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className={CLASE_LABEL}>
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={CLASE_INPUT}
            />
          </div>
          <ErrorAlert message={error} />
          <BotonesModal saving={saving} onCancelar={cerrarModal} />
        </form>
      </Modal>

      {/* Modal: Contraseña */}
      <Modal isOpen={campoAbierto === 'password'} onClose={cerrarModal} title="Cambiar contraseña">
        <form onSubmit={guardarPassword} noValidate className="flex flex-col gap-4">
          <div>
            <label htmlFor="passwordActual" className={CLASE_LABEL}>
              Contraseña actual
            </label>
            <CampoPassword
              id="passwordActual"
              value={passwordActual}
              onChange={(e) => setPasswordActual(e.target.value)}
              placeholder="Tu contraseña actual"
              autoComplete="current-password"
              className={CLASE_INPUT}
            />
          </div>
          <div>
            <label htmlFor="passwordNueva" className={CLASE_LABEL}>
              Nueva contraseña
            </label>
            <CampoPassword
              id="passwordNueva"
              value={passwordNueva}
              onChange={(e) => setPasswordNueva(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              className={CLASE_INPUT}
            />
          </div>
          <ErrorAlert message={error} />
          <BotonesModal saving={saving} onCancelar={cerrarModal} />
        </form>
      </Modal>
    </AccountLayout>
  )
}

export default Seguridad