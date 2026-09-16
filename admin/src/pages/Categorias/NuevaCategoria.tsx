import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'

export default function NuevaCategoria() {
  const [nombre, setNombre] = useState('')
  const [errorNombre, setErrorNombre] = useState('');
  const { mostrarToast } = useToast();
  const navigate = useNavigate()

  const guardarCategoria = (e: React.SubmitEvent) => {
    e.preventDefault();
    setErrorNombre('');

    let hayErrores = false

    if (nombre.trim().length < 3) {
      setErrorNombre('El nombre debe tener al menos 3 caracteres.')
      hayErrores = true
    }

    if (hayErrores) {
      return
    }

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
    mostrarToast('Categoria creada!')
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
            maxLength={15}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Ej: Hamburguesas"
          />
        </div>

        {errorNombre && (
          <p className="text-red-600 text-sm m-1">
            {errorNombre}
          </p>
        )}

       <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">

          <button
          type="button"
          onClick={() => navigate('/admin/categorias')}
          className="bg-danger hover:bg-danger-hover text-white
          border border-red-300 px-4 py-2 rounded transition-colors">
            Cancelar
          </button>

          <button
          type="submit"
          className="bg-action hover:bg-action-hover
           border border-orange-300 text-white px-4 py-2 rounded transition-colors">
            Crear categoria
          </button>
        </div>
      </form>
    </main>
  )
}