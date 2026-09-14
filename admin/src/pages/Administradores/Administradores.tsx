import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Paginacion from '../../components/Paginacion';
import { Pencil, Trash2, Plus } from 'lucide-react'

export default function Administradores() {
    const navigate = useNavigate();
    const [paginaActual, setPaginaActual] = useState(1);
    const adminsPorPagina = 5;

    const [administradores, setAdministradores] = useState(() => {
        const administradoresGuardados = localStorage.getItem('administradores')

        if (administradoresGuardados) {
            return JSON.parse(administradoresGuardados)
        }
        return []
    })

    const eliminarAdministrador = (id: number) => {
        const administradoresActualizados = administradores.filter(
            (administrador:any) => administrador.id !== id)

    setAdministradores(administradoresActualizados)

    localStorage.setItem('administradores',
    JSON.stringify(administradoresActualizados))}

    const indiceUltimoAdmin = 
    paginaActual * adminsPorPagina

    const indicePrimerAdmin =
    indiceUltimoAdmin - adminsPorPagina

    const administradoresPagina = administradores.slice(
    indicePrimerAdmin,
    indiceUltimoAdmin
    )

    return (
    <main className="p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
                <h1 className="text-3xl font-bold">
                    Administradores
                </h1>

                <p className="mt-2 text-gray-600">
                    Gestión de administradores del sistema.
                </p>
            </div>

            <button onClick={() => navigate('/admin/administradores/nuevo')}
            className="bg-action text-white px-4 py-4 rounded-full border 
            shadow-[0_0_10px_rgba(249,115,22,0.6)]
            hover:shadow-[0_0_16px_rgba(249,115,22,0.8)]
            transition-all
            border-orange-400 
            hover:bg-action-hover w-fit ml-auto">
                <Plus size={22} />
            </button>
        </div>

        <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="w-full">
            <thead className="bg-gray-100">
                <tr>
                    <th className="text-left px-6 py-3">Nombre</th>
                    <th className="text-left px-6 py-3">Email</th>
                    <th className="text-right px-6 py-3">Acciones</th>
                </tr>
            </thead>

            <tbody>
                {administradoresPagina.map(
                    (administrador: {
                    id: number
                    nombre: string
                    email: string
                }) => (
                <tr key={administrador.id} className="border-b border-t">
                    <td className="px-6 py-4">
                        {administrador.nombre}
                    </td>

                    <td className="px-6 py-4">
                        {administrador.email}
                    </td>

                    <td className="flex justify-end gap-2 px-6 py-4">
                        <button onClick={() => navigate(`/admin/administradores/editar/${administrador.id}`)}
                        className="bg-emerald-200 text-success hover:text-success-hover p-2 border rounded
                        hover:drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                            <Pencil size={18} />
                        </button>

                        <button onClick={() => eliminarAdministrador(administrador.id)}
                        className="bg-red-200 text-danger hover:text-danger-hover p-2 border rounded
                        hover:drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                            <Trash2 size={18} />
                        </button>
                    </td>
                </tr>
                ))}
            </tbody>
        </table>
        </div>
        <Paginacion
            paginaActual={paginaActual}
            totalElementos={administradores.length}
            elementosPorPagina={adminsPorPagina}
            cambiarPagina={setPaginaActual} />
    </main>
  )
}