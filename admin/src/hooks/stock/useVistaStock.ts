import { useSearchParams } from 'react-router-dom'
import { PARAM_BUSQUEDA, PARAM_VISTA } from '../../utils/navegacion/parametros'
import { esVistaStock, type VistaStock } from '../../utils/navegacion/rutasStock'

// Vista activa de Stock (?vista=movimientos). Un aviso de stock bajo (?buscar=)
// siempre abre Insumos, aunque el enlace traiga otra vista (RN-43).
export function useVistaStock(): VistaStock {
  const [searchParams] = useSearchParams()
  if (searchParams.has(PARAM_BUSQUEDA)) return 'insumos'
  const vista = searchParams.get(PARAM_VISTA)
  return esVistaStock(vista) ? vista : 'insumos'
}
