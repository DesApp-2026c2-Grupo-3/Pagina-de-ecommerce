import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import {
  obtenerRepartidorPorId,
  actualizarRepartidor
} from '../../services/repartidorService'
import { obtenerSucursales } from '../../services/sucursalService'

export default function EditarRepartidor() {
  const { id } = useParams()
  const { mostrarToast } = useToast()
  const { administrador } = useAuth()
  const navigate = useNavigate()

  const esMaster = administrador?.rol === 'MASTER'

  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sucursalId, setSucursalId] = useState('')
  const [sucursales, setSucursales] = useState<any[]>([])

  const [errorNombre, setErrorNombre] = useState('')
  const [errorApellido, setErrorApellido] = useState('')
  const [errorEmail, setErrorEmail] = useState('')
  const [errorPassword, setErrorPassword] = useState('')
  const [errorSucursal, setErrorSucursal] = useState('')

  const guardarCambios = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    let hayErrores = false

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

    if (esMaster && sucursalId === '') {
      setErrorSucursal('Seleccioná una sucursal.')
      hayErrores = true
    }

    if (password !== '') {
      if (password.length < 8 || password.length > 20) {
        setErrorPassword('La contraseña debe tener entre 8 y 20 caracteres.')
        hayErrores = true
      } else if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        setErrorPassword('La contraseña debe contener al menos una mayúscula y un número.')
        hayErrores = true
      }
    }

    if (hayErrores) return

    const repartidorActualizado = {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email: email.trim(),
      ...(esMaster && { sucursalId: Number(sucursalId) }),
      ...(password !== '' && { password })
    }

    try {
      await actualizarRepartidor(Number(id), repartidorActualizado)

      mostrarToast('Repartidor modificado!')
      navigate('/admin/repartidores')
    } catch (error) {
      console.error('Error al actualizar repartidor:', error)

      mostrarToast(
        error instanceof Error
          ? error.message
          : 'Error al actualizar el repartidor'
      )
    }
  }

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const repartidor = await obtenerRepartidorPorId(Number(id))

        setNombre(repartidor.nombre)
        setApellido(repartidor.apellido)
        setEmail(repartidor.email)
        setSucursalId(repartidor.sucursalId.toString())

        if (esMaster) {
          const datosSucursales = await obtenerSucursales()
          setSucursales(datosSucursales)
        }
      } catch (error) {
        console.error('Error al cargar repartidor:', error)
        mostrarToast(
          error instanceof Error
            ? error.message
            : 'Error al cargar el repartidor'
        )
      }
    }

    if (id) cargarDatos()
  }, [id, esMaster])

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">
        Editar repartidor
      </h1>

      <form
        onSubmit={guardarCambios}
        className="max-w-md"
        noValidate
      >
        <div className="mb-4">
          <label className="block mb-2 font-medium">Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value)
              setErrorNombre('')
            }}
            className="w-full border rounded px-3 py-2"
          />
          {errorNombre && <p className="text-red-600 text-sm m-1">{errorNombre}</p>}
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-medium">Apellido</label>
          <input
            type="text"
            value={apellido}
            onChange={(e) => {
              setApellido(e.target.value)
              setErrorApellido('')
            }}
            className="w-full border rounded px-3 py-2"
          />
          {errorApellido && <p className="text-red-600 text-sm m-1">{errorApellido}</p>}
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setErrorEmail('')
            }}
            className="w-full border rounded px-3 py-2"
          />
          {errorEmail && <p className="text-red-600 text-sm m-1">{errorEmail}</p>}
        </div>

        {esMaster && (
          <div className="mb-4">
            <label className="block mb-2 font-medium">Sucursal</label>
            <select
              value={sucursalId}
              onChange={(e) => {
                setSucursalId(e.target.value)
                setErrorSucursal('')
              }}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Seleccionar sucursal</option>
              {sucursales
                .filter((sucursal) => sucursal.activa)
                .map((sucursal) => (
                  <option key={sucursal.id} value={sucursal.id}>
                    {sucursal.nombre}
                  </option>
                ))}
            </select>
            {errorSucursal && <p className="text-red-600 text-sm m-1">{errorSucursal}</p>}
          </div>
        )}

        <div className="mb-4">
          <label className="block mb-2 font-medium">
            Contraseña (opcional)
          </label>
          <input
            type="password"
            value={password}
            maxLength={20}
            onChange={(e) => {
              setPassword(e.target.value)
              setErrorPassword('')
            }}
            className="w-full border rounded px-3 py-2"
          />
          {errorPassword && <p className="text-red-600 text-sm m-1">{errorPassword}</p>}
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate('/admin/repartidores')}
            className="bg-danger hover:bg-danger-hover text-white border border-red-300 px-4 py-2 rounded transition-colors"
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="bg-action hover:bg-action-hover border border-orange-300 text-white px-4 py-2 rounded transition-colors"
          >
            Guardar cambios
          </button>
        </div>
      </form>
    </main>
  )
}