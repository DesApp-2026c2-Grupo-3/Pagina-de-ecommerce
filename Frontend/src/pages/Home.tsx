import Hero from '../components/home/Hero'
import GuestQuickAccessRow from '../components/home/GuestQuickAccessRow'
import CompanySection from '../components/home/CompanySection'
import ContactSection from '../components/home/ContactSection'
import SucursalesMap from '../components/home/SucursalesMap'
import { useAuth } from '../context/AuthContext'

function Home() {
  const { isAuthenticated } = useAuth()

  return (
    <div id="menu">
      <Hero />
      {isAuthenticated && <GuestQuickAccessRow />}
      <CompanySection />
      <SucursalesMap />
      <ContactSection />
    </div>
  )
}

export default Home