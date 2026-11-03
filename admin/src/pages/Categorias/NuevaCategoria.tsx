import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import { crearCategoria, obtenerCategorias } from '../../services/categoriaService'
import CamposCategoria, {
  extrasAPedido,
  extrasVacios,
  type CategoriaOpcion,
  type ExtrasCategoria,
} from '../../components/CamposCategoria'

export default function NuevaCategoria() {
  const [nombre, setNombre] = useState('')
  const [extras, setExtras] = useState<ExtrasCategoria>(extrasVacios)
  const [categorias, setCategorias] = useState<CategoriaOpcion[]>([])
  const [errorNombre, setErrorNombre] = useState('');
  const [errorServidor, setErrorServidor] = useState('')
  const { mostrarToast } = useToast();
  const navigate = useNavigate()

  useEffect(() => {
    obtenerCategorias()
      .then(setCategorias)
      .catch((error) => console.error('Error al cargar categorías:', error))
  }, [])

  const guardarCategoria = async (e: React.SubmitEvent) => {
    e.preventDefault();

    let hayErrores = false

    if (nombre.trim().length < 3) {
      setErrorNombre('El nombre debe tener al menos 3 caracteres.')
      hayErrores = true
    }

    if (hayErrores) {
      return
    }

    try {
      await crearCategoria({ nombre, ...extrasAPedido(extras) })

      mostrarToast('Categoria creada!')
      navigate('/admin/categorias')
    } catch (error) {
      console.error('Error al crear categoria:', error)
      setErrorServidor(error instanceof Error ? error.message : 'No se pudo crear la categoría.')
    }
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
            maxLength={20}
            onChange={(e) => {setNombre(e.target.value); setErrorNombre(''); setErrorServidor('')}}
            className="w-full border rounded px-3 py-2"
            placeholder="Ej: Hamburguesas"
          />
        </div>

        {errorNombre && (
          <p className="text-red-600 text-sm m-1">
            {errorNombre}
          </p>
        )}

        <CamposCategoria categorias={categorias} valor={extras} onChange={(v) => { setExtras(v); setErrorServidor('') }} />

        {errorServidor && (
          <p role="alert" className="text-red-600 text-sm m-1">
            {errorServidor}
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
