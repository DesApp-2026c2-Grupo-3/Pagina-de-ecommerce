import { Outlet } from 'react-router-dom'
import NavBar from './NavBar'
import Footer from './Footer'
import type { AdministradorSesion } from '../App'

interface AdminLayoutProps {
  administrador: AdministradorSesion | null
  setAdministrador: React.Dispatch<
    React.SetStateAction<AdministradorSesion | null>
  >
}

export default function AdminLayout({administrador, setAdministrador}:AdminLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar administrador={administrador}  setAdministrador={setAdministrador}/>

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}