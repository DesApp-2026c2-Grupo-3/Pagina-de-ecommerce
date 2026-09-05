import { Route, Routes } from 'react-router-dom'
import Footer from './components/layout/Footer'
import Navbar from './components/layout/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import ProductDetail from './pages/ProductDetail'
import Register from './pages/Register'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'

function App() {
  return (
    <div className="min-h-screen bg-brand-cream text-brand-dark">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
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