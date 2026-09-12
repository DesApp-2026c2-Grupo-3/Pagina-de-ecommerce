import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Administradores() {
    const navigate = useNavigate();
    const [administradores, setAdministradores] = useState(() => {
        const administradoresGuardados = localStorage.getItem('administradores')

        if (administradoresGuardados) {
            return JSON.parse(administradoresGuardados)
        }
        return []
    })

    const eliminarAdministrador = (id: number) => {
        const administradoresActualizados = administradores.filter(
            (administrador) => administrador.id !== id)

    setAdministradores(administradoresActualizados)

    localStorage.setItem('administradores',
    JSON.stringify(administradoresActualizados))}

    return (
    <main className="p-8">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-3xl font-bold">
                    Administradores
                </h1>

                <p className="mt-2 text-gray-600">
                    Gestión de administradores del sistema.
                </p>
            </div>

            <button onClick={() => navigate('/admin/administradores/nuevo')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Nuevo administrador
            </button>
        </div>

        <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full">
            <thead className="bg-gray-100">
                <tr>
                    <th className="text-left px-6 py-3">Nombre</th>
                    <th className="text-left px-6 py-3">Email</th>
                    <th className="text-left px-6 py-3">Acciones</th>
                </tr>
            </thead>

            <tbody>
                {administradores.map(
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

                    <td className="px-6 py-4">
                        <button onClick={() => navigate(
                            `/admin/administradores/editar/${administrador.id}`)}
                            className="text-blue-600 pr-1 hover:text-blue-800">
                                Editar
                        </button>

                        <button onClick={() => eliminarAdministrador(administrador.id)}
                        className="text-red-600 hover:text-red-800">
                            Eliminar
                        </button>
                    </td>
                </tr>
                ))}
            </tbody>
        </table>
        </div>
    </main>
  )
}