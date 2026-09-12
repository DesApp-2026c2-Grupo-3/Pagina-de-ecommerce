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

        <table className="w-full border-collapse">
            <thead>
                <tr className="border-b">
                    <th className="text-left p-3">Nombre</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Acciones</th>
                </tr>
            </thead>

            <tbody>
                {administradores.map(
                    (administrador: {
                    id: number
                    nombre: string
                    email: string
                }) => (
                <tr key={administrador.id} className="border-b">
                    <td className="p-3">
                        {administrador.nombre}
                    </td>

                    <td className="p-3">
                        {administrador.email}
                    </td>

                    <td className="p-3">
                        <button onClick={() => navigate(
                            `/admin/administradores/editar/${administrador.id}`)}
                            className="text-blue-600 mr-4">
                                Editar
                        </button>

                        <button onClick={() => eliminarAdministrador(administrador.id)}
                        className="text-red-600">
                            Eliminar
                        </button>
                    </td>
                </tr>
                ))}
            </tbody>
        </table>
    </main>
  )
}