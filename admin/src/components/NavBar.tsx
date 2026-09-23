import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Menu, LogOut } from 'lucide-react';
import type { AdministradorSesion } from '../App';

interface NavbarProps {
  administrador: AdministradorSesion | null
  setAdministrador: React.Dispatch<
    React.SetStateAction<AdministradorSesion | null>
  >
}

export default function Navbar({administrador, setAdministrador}:NavbarProps) { 
    const [menuAbierto, setMenuAbierto] = useState(false);
    const navigate = useNavigate()

    const cerrarSesion = () => {
        setAdministrador(null)
        localStorage.removeItem('administrador')
        navigate('/')
    }

    return (
    <nav className="bg-gray-900 text-white">
        <div className="flex items-center justify-between px-6 py-4">
            <h1 className="text-xl font-bold">
                Administración
            </h1>


    {/* Botón móvil */}
            <button
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="md:hidden text-2xl"
            aria-label="Abrir menú">
                <Menu size={20} />
            </button>
            

    {/* Menú desktop */}
            <div className="hidden md:flex gap-4">
                <div className="block text-right">
                    <p className="font-medium">
                        {administrador?.nombre}
                    </p>

                    <p className="text-sm text-gray-400">
                        {administrador?.rol}
                    </p>
                </div>

                <NavLink
                to="/admin"
                end
                className={({ isActive }) => isActive
                ? 'font-bold text-action drop-shadow-[0_0_6px_rgba(249,115,22,0.8)]'
                : 'hover:text-action-hover'
                }>
                Inicio
                </NavLink>

                <NavLink
                to="/admin/productos"
                className={({ isActive }) => isActive
                ? 'font-bold text-action drop-shadow-[0_0_6px_rgba(249,115,22,0.8)]'
                : 'hover:text-action-hover'
                }>
                Productos
                </NavLink>

                <NavLink
                to="/admin/categorias"
                className={({ isActive }) => isActive
                ? 'font-bold text-action drop-shadow-[0_0_6px_rgba(249,115,22,0.8)] '
                : 'hover:text-action-hover'
                }>
                Categorías
                </NavLink>

                <NavLink
                to="/admin/administradores"
                className={({ isActive }) => isActive
                ? 'font-bold text-action drop-shadow-[0_0_6px_rgba(249,115,22,0.8)]'
                : 'hover:text-action-hover'
                }>
                Administradores
                </NavLink>

                <button onClick={cerrarSesion}
                className="bg-danger hover:bg-danger-hover
                py-2 px-3 rounded border">
                    <LogOut size={18} />
                </button>
            </div>
        </div>

  {/* Menú móvil */}
        {menuAbierto && (
            <div className="md:hidden flex flex-col gap-4 px-6 pb-4">

                <NavLink
                to="/admin"
                end
                onClick={() => setMenuAbierto(false)}
                className={({ isActive }) => isActive
                ? 'font-bold text-action drop-shadow-[0_0_6px_rgba(249,115,22,0.8)]'
                : 'hover:text-action-hover'
                }>
                Inicio
                </NavLink>

                <NavLink
                to="/admin/productos"
                onClick={() => setMenuAbierto(false)}
                className={({ isActive }) => isActive
                ? 'font-bold text-action drop-shadow-[0_0_6px_rgba(249,115,22,0.8)]'
                : 'hover:text-action-hover'
                }>
                Productos
                </NavLink>

                <NavLink
                to="/admin/categorias"
                onClick={() => setMenuAbierto(false)}
                className={({ isActive }) => isActive
                ? 'font-bold text-action drop-shadow-[0_0_6px_rgba(249,115,22,0.8)]'
                : 'hover:text-action-hover'
                }>
                Categorías
                </NavLink>

                <NavLink
                to="/admin/administradores"
                onClick={() => setMenuAbierto(false)}
                className={({ isActive }) => isActive
                ? 'font-bold text-action drop-shadow-[0_0_6px_rgba(249,115,22,0.8)]'
                : 'hover:text-action-hover'
                }>
                Administradores
                </NavLink>

                <div className='flex items-center gap-6 bg-gray-700 w-fit rounded p-2'>
                    <div className="block">
                        <p className="font-medium">
                            {administrador?.nombre}
                        </p>

                        <p className="text-sm text-gray-400">
                            {administrador?.rol}
                        </p>
                    </div>

                    <div>    
                        <button onClick={cerrarSesion}
                        className="bg-danger hover:bg-danger-hover
                        py-3 px-2 rounded border">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>

            </div>
        )}
    </nav>
    )
}