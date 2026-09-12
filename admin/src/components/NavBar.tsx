import { NavLink } from 'react-router-dom'

export default function Navbar() { 
    return (
    <nav className="flex items-center justify-between px-6 py-4 bg-gray-900 text-white">
        <h1 className="text-xl font-bold"> Administración </h1>
        <div className="flex gap-4">
            <NavLink to="/" className={({ isActive }) => isActive ? 'font-bold text-blue-400' : 'hover:text-blue-300' } >
                Inicio 
            </NavLink>

            <NavLink to="/admin/productos" 
            className={({ isActive }) => isActive ? 'font-bold text-blue-400' : 'hover:text-blue-300' } >
                Productos 
            </NavLink>

            <NavLink to="admin/categorias" className={({ isActive }) => isActive ? 'font-bold text-blue-400' : 'hover:text-blue-300' } >
                Categorías
            </NavLink>
            
            <NavLink to="/admin/administradores" className={({ isActive }) => isActive ? 'font-bold text-blue-400' : 'hover:text-blue-300' } >
                Administradores
            </NavLink>
        </div>
    </nav> ) }