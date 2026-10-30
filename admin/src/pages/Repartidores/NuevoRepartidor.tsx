import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { obtenerSucursales } from '../../services/sucursalService'
import { crearRepartidor } from '../../services/repartidorService'
import type { PayloadRepartidor } from '../../types/repartidor.types'

interface SucursalOpcion {
  id: number
  nombre: string
  activa: boolean
}

export default function NuevoRepartidor() {
  const navigate = useNavigate()
  const { administrador } = useAuth()

  const esMaster = administrador?.rol === 'MASTER'
  const sucursalIdAdmin = administrador?.sucursalId

  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sucursalId, setSucursalId] = useState(
    sucursalIdAdmin ? String(sucursalIdAdmin) : ''
  )

  const [sucursales, setSucursales] = useState<SucursalOpcion[]>([])
  const [cargandoSucursales, setCargandoSucursales] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!esMaster) return

    const cargarSucursales = async () => {
      try {
        setCargandoSucursales(true)
        const datos = await obtenerSucursales()
        setSucursales(datos.filter((sucursal) => sucursal.activa))
      } catch (error) {
        console.error('Error al cargar sucursales:', error)
        setError('No se pudieron cargar las sucursales.')
      } finally {
        setCargandoSucursales(false)
      }
    }

    cargarSucursales()
  }, [esMaster])

  const guardarRepartidor = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (nombre.trim().length < 3) {
      setError('El nombre debe tener al menos 3 caracteres.')
      return
    }

    if (apellido.trim().length < 3) {
      setError('El apellido debe tener al menos 3 caracteres.')
      return
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Ingresá un email válido.')
      return
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError('La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.')
      return
    }

    if (!sucursalId) {
      setError('Debés seleccionar una sucursal.')
      return
    }

    const payload: PayloadRepartidor = {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email: email.trim(),
      password,
      sucursalId: Number(sucursalId),
    }

    try {
      setGuardando(true)
      await crearRepartidor(payload)
      navigate('/admin/repartidores')
    } catch (error) {
      console.error('Error al crear repartidor:', error)
      setError(
        error instanceof Error
          ? error.message
          : 'No se pudo crear el repartidor.'
      )
    } finally {
      setGuardando(false)
    }
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-md">
        <h1 className="mb-2 text-3xl font-bold">Nuevo repartidor</h1>
        <p className="mb-6 text-gray-600">
          Completá los datos para registrar un repartidor.
        </p>

        <form
          onSubmit={guardarRepartidor}
          className="space-y-4 rounded-xl border bg-white p-6 shadow-sm"
        >
          <div>
            <label className="mb-1 block text-sm font-medium">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-lg border p-2"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Apellido</label>
            <input
              type="text"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              className="w-full rounded-lg border p-2"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border p-2"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border p-2"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Mínimo 8 caracteres, una mayúscula y un número.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Sucursal</label>

            {esMaster ? (
              <select
                value={sucursalId}
                onChange={(e) => setSucursalId(e.target.value)}
                className="w-full rounded-lg border bg-white p-2"
                required
                disabled={cargandoSucursales}
              >
                <option value="">
                  {cargandoSucursales
                    ? 'Cargando sucursales...'
                    : 'Seleccionar sucursal'}
                </option>

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
                className="w-full rounded-lg border bg-gray-100 p-2 text-gray-600"
                disabled
              />
            )}
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/admin/repartidores')}
              className="rounded-lg border px-4 py-2 hover:bg-gray-50"
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={guardando || (esMaster && cargandoSucursales)}
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Crear repartidor'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}