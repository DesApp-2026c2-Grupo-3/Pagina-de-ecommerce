// Parámetros del negocio, como los devuelve y recibe /admin/parametros
export interface Parametros {
  maxPedidosEnCurso: number
  radioEntregaKm: number
  envioBase: number
  envioPorKm: number
  preparacionBaseMin: number
  preparacionPorProductoMin: number
  viajeMinPorKm: number
  margenDemoraMin: number
  diasParaCalificar: number
  opinionesEnInicio: number
  maxPromosPorDia: number
}