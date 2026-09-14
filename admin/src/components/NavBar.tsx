import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Menu } from 'lucide-react';

export default function Navbar() { 
    const [menuAbierto, setMenuAbierto] = useState(false);

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
            </div>
        )}
    </nav>
    )
}