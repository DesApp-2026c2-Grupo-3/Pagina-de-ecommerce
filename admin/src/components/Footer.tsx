import { NavLink } from "react-router-dom"

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          
          <div>
            <h2 className="text-white text-lg font-semibold">
              Panel Administrativo
            </h2>

            <p className="text-sm mt-2">
              Gestión y administración del sistema.
            </p>
          </div>

          <div>
            <h3 className="text-white font-medium mb-2">
              Administración
            </h3>

            <ul className="text-sm space-y-1">
              <li>
                <NavLink to="/admin/productos"
                className="hover:text-action">
                  Productos
                </NavLink>
              </li>

              <li>
                <NavLink to="/admin/categorias"
                className="hover:text-action">
                  Categorías
                </NavLink>
              </li>

              <li>
                <NavLink to="/admin/administradores"
                className="hover:text-action">
                  Administradores
                </NavLink>
              </li>
            </ul>

          </div>

        </div>

        <div className="border-t border-gray-700 mt-6 pt-4 text-sm text-gray-500">
          © 2026 Plataforma de pedidos. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  )
}