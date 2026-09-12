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

  const guardarCambios = (e: React.FormEvent) => {
    e.preventDefault()

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
        className="max-w-md"
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

        <div className="mb-4">
          <label className="block mb-2 font-medium">
            Contraseña
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

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