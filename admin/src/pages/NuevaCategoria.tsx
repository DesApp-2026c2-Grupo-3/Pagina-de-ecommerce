import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function NuevaCategoria() {
  const [nombre, setNombre] = useState('')
  const navigate = useNavigate()

  const guardarCategoria = (e: React.FormEvent) => {
    e.preventDefault()

    const nuevaCategoria = {
      id: Date.now(),
      nombre,
    }

    const categoriasGuardadas = JSON.parse(
      localStorage.getItem('categorias') || '[]'
    )

    categoriasGuardadas.push(nuevaCategoria)

    localStorage.setItem(
      'categorias',
      JSON.stringify(categoriasGuardadas)
    )

    navigate('/admin/categorias')
  }

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">
        Nueva categoría
      </h1>

      <form onSubmit={guardarCategoria} className="max-w-md">
        <div className="mb-4">
          <label className="block mb-2 font-medium">
            Nombre
          </label>

          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Ej: Hamburguesas"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Guardar categoría
        </button>
      </form>
    </main>
  )
}