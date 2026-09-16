import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useToast } from '../../context/ToastContext'

export default function EditarCategoria() {
  const { id } = useParams();
  const { mostrarToast } = useToast();
  const navigate = useNavigate();

  const categoriasGuardadas = JSON.parse(
    localStorage.getItem('categorias') || '[]'
  )

  const categoria = categoriasGuardadas.find(
    (categoria: { id: number }) => 
      categoria.id === Number(id)
  )

  const [nombre, setNombre] = useState(categoria?.nombre || '');
  const [errorNombre, setErrorNombre] = useState('');

  const guardarCambios = (e: React.FormEvent) => {
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

    const categoriasActualizadas = categoriasGuardadas.map(
      (categoria: { id: number; nombre: string }) =>
        categoria.id === Number(id)
          ? {
              ...categoria,
              nombre,
            }
          : categoria
    )

    localStorage.setItem(
      'categorias',
      JSON.stringify(categoriasActualizadas)
    )
    mostrarToast('Categoria modificada!')
    navigate('/admin/categorias')
  }

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">
        Editar categoría
      </h1>

      <form onSubmit={guardarCambios} className="max-w-md">
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
            Guardar cambios
          </button>
        </div>
      </form>
    </main>
  )
}