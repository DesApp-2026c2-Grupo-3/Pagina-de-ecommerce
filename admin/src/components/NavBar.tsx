import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Menu, LogOut, X } from "lucide-react";
import type { AdministradorSesion } from "../App";
import { cerrarSesionService } from "../services/authService";
import { enlacesDe } from "../config/menu";

interface NavbarProps {
  administrador: AdministradorSesion | null;
  setAdministrador: React.Dispatch<
    React.SetStateAction<AdministradorSesion | null>
  >;
}

const claseEnlace = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? "font-bold text-action drop-shadow-[0_0_6px_rgba(249,115,22,0.8)]"
    : "hover:text-action-hover";

export default function Navbar({
  administrador,
  setAdministrador,
}: NavbarProps) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();

  const enlaces = enlacesDe(administrador);
  const rolTexto =
    administrador?.rol === "MASTER"
      ? "Administrador general"
      : `Sucursal ${administrador?.sucursal?.nombre ?? "sin asignar"}`;

  const cerrarSesion = async () => {
    try {
      await cerrarSesionService();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
    setAdministrador(null);
    localStorage.removeItem("administrador");
    navigate("/");
  };

  // Nombre, rol y botón de salir (se repite en escritorio y celular)
  const usuario = (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <p className="font-medium">{administrador?.nombre}</p>
        <p className="text-sm text-gray-400">{rolTexto}</p>
      </div>
      <button
        type="button"
        onClick={cerrarSesion}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
        className="rounded border bg-danger px-3 py-2 hover:bg-danger-hover"
      >
        <LogOut size={18} />
      </button>
    </div>
  );

  return (
    <nav className="bg-gray-900 text-white">
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-xl font-bold">Administración</h1>

        {/* Botón móvil */}
        <button
          type="button"
          onClick={() => setMenuAbierto(!menuAbierto)}
          className="text-2xl md:hidden"
          aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuAbierto}
        >
          {menuAbierto ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Menú escritorio */}
        <div className="hidden items-center gap-6 md:flex">
          {enlaces.map((e) => (
            <NavLink key={e.to} to={e.to} end={e.end} className={claseEnlace}>
              {e.label}
            </NavLink>
          ))}
          {usuario}
        </div>
      </div>

      {/* Menú móvil */}
      {menuAbierto && (
        <div className="flex flex-col gap-4 px-6 pb-4 md:hidden">
          {enlaces.map((e) => (
            <NavLink
              key={e.to}
              to={e.to}
              end={e.end}
              onClick={() => setMenuAbierto(false)}
              className={claseEnlace}
            >
              {e.label}
            </NavLink>
          ))}
          <div className="w-fit rounded bg-gray-700 p-2">{usuario}</div>
        </div>
      )}
    </nav>
  );
}
