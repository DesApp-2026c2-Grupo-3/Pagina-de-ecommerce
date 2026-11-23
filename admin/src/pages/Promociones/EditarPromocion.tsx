import { useParams } from 'react-router-dom'
import PantallaPromos from '../../components/promociones/PantallaPromos'

// Lápiz en la lista: se abre solo la pestaña de esa promo, con sus datos
export default function EditarPromocion() {
  const { id } = useParams()
  return <PantallaPromos idEditar={Number(id)} />
}
