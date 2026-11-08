import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { crearAdministrador } from '../../services/administradorService'
import { obtenerSucursales } from '../../services/sucursalService'

export default function NuevoAdministrador() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorNombre, setErrorNombre] = useState('');
  const [errorEmail, setErrorEmail] = useState('');
  const [errorPassword, setErrorPassword] = useState('');

  const [sucursalId, setSucursalId] = useState('')
  const [errorSucursal, setErrorSucursal] = useState('')
  const [sucursales, setSucursales] = useState<any[]>([])

  const { mostrarToast } = useToast();
  const navigate = useNavigate()
  const { administrador } = useAuth()
  // El master crea encargados y elige su sucursal; el encargado crea empleados de la suya
  const esMaster = administrador?.rol === 'MASTER'

  const guardarAdministrador = async (e: React.SubmitEvent) => {
    e.preventDefault();

    let hayErrores = false

    if (nombre.trim().length < 3) {
      setErrorNombre('El nombre debe tener al menos 3 caracteres.')
      hayErrores = true
    }

    if (email.trim() === '') {
      setErrorEmail('El email es obligatorio.')
      hayErrores = true
    }

    if (email.trim() !== '' && !email.includes('@')) {
      setErrorEmail('Ingresá un email válido.')
      hayErrores = true
    }

    if (email.includes('@') && !email.trim().toLowerCase().endsWith('@burgerfast.com')) {
      setErrorEmail('El email del personal debe ser @burgerfast.com.')
      hayErrores = true
    }

    if (password.trim() === '') {
      setErrorPassword('La contraseña es obligatoria.')
      hayErrores = true
    }

    if (password.length < 8) {
      setErrorPassword('La contraseña debe tener al menos 8 caracteres.')
      hayErrores = true
    }

    if (!/[A-Z]/.test(password)) {
      setErrorPassword('La contraseña debe contener al menos una mayúscula.')
      hayErrores = true
    }

    if (!/[0-9]/.test(password)) {
      setErrorPassword('La contraseña debe contener al menos un número.')
      hayErrores = true
    }

    if (esMaster && sucursalId === '') {
      setErrorSucursal('Seleccioná una sucursal.')
      hayErrores = true
    }

    if (hayErrores) {
      return
    }

    const nuevoAdministrador = {
      nombre,
      email,
      password,
      // El encargado siempre crea empleados de su propia sucursal
      sucursalId: esMaster ? Number(sucursalId) : administrador?.sucursalId,
    }
    
    try {
      await crearAdministrador(nuevoAdministrador)

      mostrarToast(esMaster ? 'Encargado creado!' : 'Empleado creado!')
      navigate('/admin/administradores')
    } catch (error) {
      console.error('Error al crear administrador:', error)
      mostrarToast(
    error instanceof Error ? error.message : "Error al crear administrador"
  );
    }
  }

  useEffect(() => {
  const cargarSucursales = async () => {
    try {
      const datos = await obtenerSucursales()
      setSucursales(datos)
    } catch (error) {
      console.error('Error al cargar sucursales:', error)
    }
  }

  // Solo el master elige sucursal (la lista de sucursales es solo para él)
  if (esMaster) cargarSucursales()
}, [esMaster])

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">
        {esMaster ? 'Nuevo encargado' : 'Nuevo empleado'}
      </h1>

      <form
        onSubmit={guardarAdministrador}
        className="max-w-md" noValidate
      >
        <div className="mb-4">
          <label className="block mb-2 font-medium">
            Nombre
          </label>

          <input
            type="text"
            value={nombre}
            maxLength={40}
            onChange={(e) => {setNombre(e.target.value); setErrorNombre('')}}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {errorNombre && (
          <p className="text-red-600 text-sm m-1">
            {errorNombre}
          </p>
        )}

        <div className="mb-4">
          <label className="block mb-2 font-medium">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => {setEmail(e.target.value); setErrorEmail('')}}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {errorEmail && (
          <p className="text-red-600 text-sm m-1">
            {errorEmail}
          </p>
        )}


        {esMaster && (
        <>
        <div className="mb-4">
          <label className="block mb-2 font-medium">
            Sucursal
          </label>

        <select
          value={sucursalId}
          onChange={(e) => {
            setSucursalId(e.target.value)
            setErrorSucursal('')
          }}
          className="w-full border rounded px-3 py-2">

          <option value="">Seleccionar sucursal</option>
          
          {sucursales
            .filter((sucursal) => sucursal.activa)
            .map((sucursal) => (
            <option key={sucursal.id} value={sucursal.id}>
                {sucursal.nombre}
            </option>
          ))}
        </select>
        </div>

        {errorSucursal && (
          <p className="text-red-600 text-sm m-1">
            {errorSucursal}
          </p>
        )}
        </>
        )}

        {!esMaster && (
          <p className="mb-4 text-gray-600">
            Se crea en tu sucursal{administrador?.sucursal ? `: ${administrador.sucursal.nombre}` : ''}.
          </p>
        )}


        <div className="mb-4">
          <label className="block mb-2 font-medium">
            Contraseña
          </label>

          <input
            type="password"
            value={password}
            maxLength={20}
            onChange={(e) => {setPassword(e.target.value); setErrorPassword('')}}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        
        {errorPassword && (
          <p className="text-red-600 text-sm m-1">
            {errorPassword}
          </p>
        )}

        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">

          <button
          type="button"
          onClick={() => navigate('/admin/administradores')}
          className="bg-danger hover:bg-danger-hover text-white
          border border-red-300 px-4 py-2 rounded transition-colors">
            Cancelar
          </button>

          <button
          type="submit"
          className="bg-action hover:bg-action-hover
           border border-orange-300 text-white px-4 py-2 rounded transition-colors">
            {esMaster ? 'Crear encargado' : 'Crear empleado'}
          </button>
        </div>
      </form>
    </main>
  )
}