import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useToast } from '../../context/ToastContext'
import { obtenerAdministradorPorId, actualizarAdministrador } from '../../services/administradores';


export default function EditarAdministrador() {
  const { id } = useParams();
  const { mostrarToast } = useToast();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [errorNombre, setErrorNombre] = useState('');
  const [errorEmail, setErrorEmail] = useState('');
  const [errorPassword, setErrorPassword] = useState('');

  const guardarCambios = async (e: React.SubmitEvent) => {
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

    if (password !== '') {
      if(password.length < 8){
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
    }

    if (hayErrores) {
      return
    }

    const administradorActualizado = {
      nombre,
      email,
      ...(password !== '' && { password })
    }

    try {
      await actualizarAdministrador(
      Number(id),
      administradorActualizado
    )
      mostrarToast('Administrador modificado!')
      navigate('/admin/administradores')
  } catch (error) {
      console.error('Error al actualizar administrador:', error)
  }
}

  useEffect(() => {
  const cargarAdministrador = async () => {
    try {
      const administrador = await obtenerAdministradorPorId(Number(id))

      setNombre(administrador.nombre)
      setEmail(administrador.email)
    } catch (error) {
      console.error('Error al cargar administrador:', error)
    }
  }

  cargarAdministrador()
}, [id])

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">
        Editar administrador
      </h1>

      <form
        onSubmit={guardarCambios}
        className="max-w-md" noValidate
      >
        <div className="mb-4">
          <label className="block mb-2 font-medium">
            Nombre
          </label>

          <input
            type="text"
            value={nombre}
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
            Guardar cambios
          </button>
        </div>
      </form>
    </main>
  )
}