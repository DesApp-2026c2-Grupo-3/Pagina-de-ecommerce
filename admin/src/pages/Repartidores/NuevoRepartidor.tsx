import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { obtenerSucursales } from '../../services/sucursalService'
import { crearRepartidor } from '../../services/repartidorService'
import type { PayloadRepartidor } from '../../types/repartidor.types'

interface SucursalOpcion {
  id: number
  nombre: string
  activa: boolean
}

export default function NuevoRepartidor() {
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [errorNombre, setErrorNombre] = useState('')
  const [errorApellido, setErrorApellido] = useState('')
  const [errorEmail, setErrorEmail] = useState('')
  const [errorPassword, setErrorPassword] = useState('')
  const [errorSucursal, setErrorSucursal] = useState('')

  const [sucursalId, setSucursalId] = useState('')

  const [sucursales, setSucursales] = useState<SucursalOpcion[]>([])

  const { administrador } = useAuth()
  const { mostrarToast } = useToast()
  const navigate = useNavigate()

  const esMaster = administrador?.rol === 'MASTER'
  const sucursalIdAdmin = administrador?.sucursalId

  useEffect(() => {
    if (!esMaster) return

    const cargarSucursales = async () => {
      try {
        const datos = await obtenerSucursales()
        setSucursales(datos.filter((sucursal: SucursalOpcion) => sucursal.activa))
      } catch (error) {
        console.error('Error al cargar sucursales:', error)
        mostrarToast('Error al cargar las sucursales.')
      }
    }

    cargarSucursales()
  }, [esMaster, mostrarToast])

  const guardarRepartidor = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    let hayErrores = false

    setErrorNombre('')
    setErrorApellido('')
    setErrorEmail('')
    setErrorPassword('')
    setErrorSucursal('')

    if (nombre.trim().length < 3) {
      setErrorNombre('El nombre debe tener al menos 3 caracteres.')
      hayErrores = true
    }

    if (apellido.trim().length < 3) {
      setErrorApellido('El apellido debe tener al menos 3 caracteres.')
      hayErrores = true
    }

    if (email.trim() === '') {
      setErrorEmail('El email es obligatorio.')
      hayErrores = true
    } else if (!email.includes('@')) {
      setErrorEmail('Ingresá un email válido.')
      hayErrores = true
    }

    if (password.trim() === '') {
      setErrorPassword('La contraseña es obligatoria.')
      hayErrores = true
    } else if (password.length < 8) {
      setErrorPassword('La contraseña debe tener al menos 8 caracteres.')
      hayErrores = true
    } else if (!/[A-Z]/.test(password)) {
      setErrorPassword('La contraseña debe contener al menos una mayúscula.')
      hayErrores = true
    } else if (!/[0-9]/.test(password)) {
      setErrorPassword('La contraseña debe contener al menos un número.')
      hayErrores = true
    }

    const sucursalAsignada = esMaster
      ? sucursalId
      : sucursalIdAdmin ? String(sucursalIdAdmin) : ''

    if (sucursalAsignada === '') {
      setErrorSucursal('Seleccioná una sucursal.')
      hayErrores = true
    }

    if (hayErrores) return

    const nuevoRepartidor: PayloadRepartidor = {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email: email.trim(),
      password,
      sucursalId: Number(sucursalAsignada),
    }

    try {
      await crearRepartidor(nuevoRepartidor)

      mostrarToast('¡Repartidor creado!')
      navigate('/admin/repartidores')
    } catch (error) {
      console.error('Error al crear repartidor:', error)

      mostrarToast(
        error instanceof Error
          ? error.message
          : 'Error al crear repartidor'
      )
    }
  }

  return (
    <main className="p-8">
      <h1 className="mb-6 text-3xl font-bold">
        Nuevo repartidor
      </h1>

      <form
        onSubmit={guardarRepartidor}
        className="max-w-md"
        noValidate
      >
        <div className="mb-4">
          <label className="mb-2 block font-medium">
            Nombre
          </label>

          <input
            type="text"
            value={nombre}
            maxLength={30}
            onChange={(e) => {
              setNombre(e.target.value)
              setErrorNombre('')
            }}
            className="w-full rounded border px-3 py-2"
          />
        </div>

        {errorNombre && (
          <p className="m-1 text-sm text-red-600">
            {errorNombre}
          </p>
        )}

        <div className="mb-4">
          <label className="mb-2 block font-medium">
            Apellido
          </label>

          <input
            type="text"
            value={apellido}
            maxLength={30}
            onChange={(e) => {
              setApellido(e.target.value)
              setErrorApellido('')
            }}
            className="w-full rounded border px-3 py-2"
          />
        </div>

        {errorApellido && (
          <p className="m-1 text-sm text-red-600">
            {errorApellido}
          </p>
        )}

        <div className="mb-4">
          <label className="mb-2 block font-medium">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setErrorEmail('')
            }}
            className="w-full rounded border px-3 py-2"
          />
        </div>

        {errorEmail && (
          <p className="m-1 text-sm text-red-600">
            {errorEmail}
          </p>
        )}

        <div className="mb-4">
          <label className="mb-2 block font-medium">
            Sucursal
          </label>

          {esMaster ? (
            <select
              value={sucursalId}
              onChange={(e) => {
                setSucursalId(e.target.value)
                setErrorSucursal('')
              }}
              className="w-full rounded border px-3 py-2"
            >
              <option value="">Seleccionar sucursal</option>

              {sucursales.map((sucursal) => (
                <option key={sucursal.id} value={sucursal.id}>
                  {sucursal.nombre}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={administrador?.sucursal?.nombre ?? 'Sin sucursal asignada'}
              className="w-full rounded border bg-gray-100 px-3 py-2 text-gray-600"
              disabled
            />
          )}
        </div>

        {errorSucursal && (
          <p className="m-1 text-sm text-red-600">
            {errorSucursal}
          </p>
        )}

        <div className="mb-4">
          <label className="mb-2 block font-medium">
            Contraseña
          </label>

          <input
            type="password"
            value={password}
            maxLength={20}
            onChange={(e) => {
              setPassword(e.target.value)
              setErrorPassword('')
            }}
            className="w-full rounded border px-3 py-2"
          />

          <p className="mt-1 text-xs text-gray-500">
            Mínimo 8 caracteres, una mayúscula y un número.
          </p>
        </div>

        {errorPassword && (
          <p className="m-1 text-sm text-red-600">
            {errorPassword}
          </p>
        )}

        <div className="mt-6 flex flex-col justify-end gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate('/admin/repartidores')}
            className="rounded border border-red-300 bg-danger px-4 py-2 text-white transition-colors hover:bg-danger-hover"
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="rounded border border-orange-300 bg-action px-4 py-2 text-white transition-colors hover:bg-action-hover"
          >
            Crear repartidor
          </button>
        </div>
      </form>
    </main>
  )
}