import { Route, Routes } from 'react-router-dom'
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
import SobreNosotros from './components/home/SobreNosotros'
import ScrollToTop from './utils/scrollToTop'
import { ZonaProvider } from './context/ZonaContext'
import ElegirZonaModal from './components/ElegirZonaModal'

function App() {
  return (
    <ZonaProvider>
    <div className="flex flex-1 flex-col bg-black text-brand-dark">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Routes>
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
          <Route path="/conocenos" element={<SobreNosotros />}/>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <Toast />
      <ElegirZonaModal />
    </div>
    </ZonaProvider>
  )
}

export default App
