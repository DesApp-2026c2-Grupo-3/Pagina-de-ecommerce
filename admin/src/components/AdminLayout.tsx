
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import NavBar from './NavBar'
import Footer from './Footer'

export default function AdminLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <div className="flex min-h-screen flex-col">
      <div className={`flex min-w-0 flex-1 flex-col transition-[margin] duration-200 ${
        menuAbierto ? 'md:ml-64' : 'md:ml-20'}`}>
        <NavBar
          menuAbierto={menuAbierto}
          setMenuAbierto={setMenuAbierto}
        />

        <div className="flex min-w-0 flex-1 flex-col">

          <main className="flex-1">
            <Outlet />
          </main>
          
          <Footer />
        </div>
      </div>

      
    </div>
  )
}
