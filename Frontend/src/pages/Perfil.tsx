import { useEffect, useState, type FormEvent } from 'react'
import { Cake, IdCard, Smartphone, UserRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getPerfil, actualizarPerfil } from '../services/userService'
import Modal from '../components/Modal'
import ErrorAlert from '../components/ErrorAlert'
import AccountLayout from '../components/cuenta/AccountLayout'
import FilaDato from '../components/cuenta/FilaDato'
import BotonesModal from '../components/ui/BotonesModal'
import { CLASE_INPUT, CLASE_LABEL } from '../components/ui/formulario'
import { formatearFecha } from '../utils/fechas'
import {
  validarApellido,
  validarDni,
  validarFechaNacimiento,
  validarNombre,
  validarTelefono,
  fechaLimiteEdad,
} from '../utils/validacionesPerfil'
import type { User } from '../types/user'

type CampoEditable = 'nombre' | 'telefono' | 'fechaNacimiento' | 'dni' | null

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

  // Mientras carga, "datos" es null: por eso el "?." (el layout muestra "Cargando...")
  const filas = [
    {
      campo: 'nombre' as const,
      Icono: UserRound,
      titulo: 'Nombre y apellido',
      valor: [datos?.name, datos?.apellido].filter(Boolean).join(' '),
    },
    { campo: 'telefono' as const, Icono: Smartphone, titulo: 'Teléfono', valor: datos?.telefono },
    {
      campo: 'fechaNacimiento' as const,
      Icono: Cake,
      titulo: 'Fecha de nacimiento',
      valor: formatearFecha(datos?.fechaNacimiento),
    },
    { campo: 'dni' as const, Icono: IdCard, titulo: 'Documento de identidad', valor: datos?.dni },
  ]

  return (
    <AccountLayout titulo="Datos personales" cargando={loading || !datos}>
      <div className="overflow-hidden rounded-[1.75rem] border-2 border-brand-dark bg-white">
        {filas.map((fila, i) => (
          <FilaDato
            key={fila.campo}
            Icono={fila.Icono}
            titulo={fila.titulo}
            valor={fila.valor}
            color={i % 2 === 0 ? 'mostaza' : 'rojo'}
            onClick={() => abrirModal(fila.campo)}
          />
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
              <label htmlFor="nombre" className={CLASE_LABEL}>
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
                className={CLASE_INPUT}
              />
            </div>
            <div>
              <label htmlFor="apellido" className={CLASE_LABEL}>
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
                className={CLASE_INPUT}
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
            <label htmlFor="telefono" className={CLASE_LABEL}>
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
              className={CLASE_INPUT}
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
        subtitle="Para saludarte en tu cumpleaños."
        tamanio="sm"
      >
        <form onSubmit={guardarCambios} noValidate className="flex flex-col gap-4">
          <div>
            <label htmlFor="fechaNacimiento" className={CLASE_LABEL}>
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
              className={CLASE_INPUT}
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
            <label htmlFor="dni" className={CLASE_LABEL}>
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

export default Perfil