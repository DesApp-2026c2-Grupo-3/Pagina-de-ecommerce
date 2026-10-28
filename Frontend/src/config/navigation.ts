import { MapPin, ReceiptText, ShieldCheck, UserRound, type LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  // Entradas del menú vertical que se despliega al pasar el mouse (escritorio)
  submenu?: NavItem[]
}

export interface AccountItem extends NavItem {
  Icono: LucideIcon
}

// Links principales (navbar de escritorio)
export const NAV_LINKS: NavItem[] = [
  { label: 'Inicio', to: '/' },
  { label: 'Menú', to: '/catalogo' },
  { label: 'Promos', to: '/promociones' },
  {
    label: 'Nosotros',
    to: '/conocenos',
    submenu: [
      { label: 'Quiénes somos', to: '/conocenos#quienes-somos' },
      { label: 'Sobre nosotros', to: '/conocenos#sobre-nosotros' },
      { label: 'Nuestras sucursales', to: '/conocenos#sucursales' },
      { label: 'Trabajá con nosotros', to: '/conocenos#trabaja-con-nosotros' },
    ],
  },
]

// Secciones de "Mi cuenta" (menú desplegable y, más adelante, la página de cuenta en celular)
export const ACCOUNT_LINKS: AccountItem[] = [
  { label: 'Datos personales', to: '/perfil', Icono: UserRound },
  { label: 'Direcciones guardadas', to: '/direcciones', Icono: MapPin },
  { label: 'Historial de pedidos', to: '/historial', Icono: ReceiptText },
  { label: 'Seguridad', to: '/seguridad', Icono: ShieldCheck },
]