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

function App() {
  return (
    <div className="flex flex-1 flex-col bg-brand-cream text-brand-dark">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/productos" element={<Products />} />
          <Route path="/promociones" element={<Promociones />} />
          <Route path="/producto/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/carrito" element={<Cart />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/checkout" element={<Checkout />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
