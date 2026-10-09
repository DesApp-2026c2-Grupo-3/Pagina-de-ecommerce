import Hero from '../components/home/Hero'
import GuestQuickAccessRow from '../components/home/GuestQuickAccessRow'
import UltimoPedidoCard from '../components/home/UltimoPedidoCard'
import CategoriasRow from '../components/home/CategoriasRow'
import PromoDestacadaBanner from '../components/home/PromoDestacadaBanner'
import ComoFuncionaSection from '../components/home/ComoFuncionaSection'
import MasPedidosSection from '../components/home/MasPedidosSection'
import ContactSection from '../components/home/ContactSection'
import SucursalesMap from '../components/home/SucursalesMap'
import { useAuth } from '../context/AuthContext'

function Home() {
  const { isAuthenticated } = useAuth()

  return (
    <div id="menu" className="bg-brand-cream">
      <Hero />
      {isAuthenticated ? <UltimoPedidoCard /> : <GuestQuickAccessRow />}
      <CategoriasRow />
      <PromoDestacadaBanner />
      <ComoFuncionaSection />
      <MasPedidosSection />
      <SucursalesMap />
      <ContactSection />
    </div>
  )
}

export default Home