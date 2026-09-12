import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function NuevoAdministrador() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const navigate = useNavigate()

  const guardarAdministrador = (e: React.FormEvent) => {
    e.preventDefault()

    const nuevoAdministrador = {
      id: Date.now(),
      nombre,
      email,
      password,
    }

    const administradoresGuardados = JSON.parse(
      localStorage.getItem('administradores') || '[]'
    )

    administradoresGuardados.push(nuevoAdministrador)

    localStorage.setItem(
      'administradores',
      JSON.stringify(administradoresGuardados)
    )

    navigate('/admin/administradores')
  }

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">
        Nuevo administrador
      </h1>

      <form
        onSubmit={guardarAdministrador}
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
          Guardar administrador
        </button>
      </form>
    </main>
  )
}