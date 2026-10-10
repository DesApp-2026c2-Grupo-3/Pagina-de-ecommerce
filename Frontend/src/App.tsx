import { Route, Routes, useLocation } from 'react-router-dom'
import Footer from './components/layout/Footer'
import Navbar from './components/layout/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import ProductDetail from './pages/ProductDetail'
import Products from './pages/Products'
import Promociones from './pages/Promociones'
import Register from './pages/Register'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Perfil from './pages/Perfil'
import HistorialPedidos from './pages/HistorialPedidos'
import Address from './pages/Address'
import Seguridad from './pages/Seguridad'
import Toast from './components/Toast'
import ScrollToTop from './utils/scrollToTop'
import { ZonaProvider } from './context/ZonaContext'
import ElegirZonaModal from './components/ElegirZonaModal'
import ZonaDesdeUsuario from './components/ZonaDesdeUsuario'
import BottomNav from './components/layout/BottomNav'
import Cuenta from './pages/Cuenta'
import Conocenos from './pages/Conocenos'
import { useAuth } from './context/AuthContext'

function App() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  // En el detalle de producto no hay barra inferior (tiene su propia barra de compra)
  const conBarraInferior = !pathname.startsWith('/producto/')

  return (
    <ZonaProvider>
    <div className="flex flex-1 flex-col bg-brand-cream text-brand-dark">
      <ScrollToTop />
      <Navbar />
      {/* pb-24: espacio para la barra inferior del celular (ahí no hay footer) */}
      <main className={`flex-1 lg:pb-0 ${conBarraInferior ? 'pb-24' : ''}`}>
        {/* La key reinicia las páginas al cambiar de usuario: no quedan datos del anterior */}
        <Routes key={user?.id ?? 'invitado'}>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Products />} />
          <Route path="/promociones" element={<Promociones />} />
          <Route path="/producto/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/carrito" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/historial" element={<HistorialPedidos />} />
          <Route path="/direcciones" element={<Address />} />
          <Route path="/seguridad" element={<Seguridad />} />
          <Route path="/conocenos" element={<Conocenos />} />
          <Route path="/cuenta" element={<Cuenta />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <BottomNav />
      <Toast />
      <ZonaDesdeUsuario />
      <ElegirZonaModal />
    </div>
    </ZonaProvider>
  )
}

export default App