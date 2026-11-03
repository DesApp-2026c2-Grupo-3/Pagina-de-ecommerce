import { httpClient } from './httpClient'
import type { MenuApi } from '../types/menu'

// El menú del catálogo (grupos y subcategorías), armado por el master desde el panel
export const getMenu = () => httpClient<MenuApi>('/menu')
