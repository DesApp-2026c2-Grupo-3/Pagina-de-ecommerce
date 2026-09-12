import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function EditarAdministrador() {
  const { id } = useParams()
  const navigate = useNavigate()

  const administradoresGuardados = JSON.parse(
    localStorage.getItem('administradores') || '[]'
  )

  const administrador = administradoresGuardados.find(
    (administrador: { id: number }) =>
      administrador.id === Number(id)
  )

  const [nombre, setNombre] = useState(
    administrador?.nombre || ''
  )

  const [email, setEmail] = useState(
    administrador?.email || ''
  )

  const [password, setPassword] = useState(
    administrador?.password || ''
  )

  const [errorNombre, setErrorNombre] = useState('');
  const [errorEmail, setErrorEmail] = useState('');
  const [errorPassword, setErrorPassword] = useState('');

  const guardarCambios = (e: React.SubmitEvent) => {
    e.preventDefault();
    setErrorNombre('');
    setErrorEmail('');
    setErrorPassword('');

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

    if (hayErrores) {
      return
    }

    const administradoresActualizados =
      administradoresGuardados.map(
        (administrador: {
          id: number
          nombre: string
          email: string
          password: string
        }) =>
          administrador.id === Number(id)
            ? {
                ...administrador,
                nombre,
                email,
                password,
              }
            : administrador
      )

    localStorage.setItem(
      'administradores',
      JSON.stringify(administradoresActualizados)
    )

    navigate('/admin/administradores')
  }

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
            onChange={(e) => setNombre(e.target.value)}
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
            onChange={(e) => setEmail(e.target.value)}
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
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {errorPassword && (
          <p className="text-red-600 text-sm m-1">
            {errorPassword}
          </p>
        )}

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Guardar cambios
        </button>
      </form>
    </main>
  )
}