// ⚠️ Pendiente de backend: los cupones todavía no existen en el servidor.
// El costo de envío lo calcula el backend según la distancia (POST /pedido/cotizar).

/** false = el campo de cupón se muestra, pero avisa que todavía no está disponible */
export const CUPONES_HABILITADOS = false


// Opciones del checkout. "disponible: false" = se muestran, pero todavía no se pueden elegir.
export const FORMAS_ENTREGA = [
  { id: 'envio', titulo: 'Envío a domicilio', detalle: 'Te lo llevamos a tu dirección', disponible: true },
  // Oculto hasta que exista en el backend:
  { id: 'retiro', titulo: 'Retiro en sucursal', detalle: 'Pasás a buscarlo vos', disponible: false },
] as const

export const FORMAS_PAGO = [
  { id: 'efectivo', titulo: 'Efectivo', detalle: 'Pagás al recibir', disponible: true },
  // Ocultos hasta que exista el cobro en el backend:
  { id: 'mercadopago', titulo: 'Mercado Pago', detalle: 'Dinero en cuenta o tarjeta', disponible: false },
  { id: 'tarjeta', titulo: 'Tarjeta', detalle: 'Débito o crédito al recibir', disponible: false },
] as const

export type FormaEntrega = (typeof FORMAS_ENTREGA)[number]['id']
export type FormaPago = (typeof FORMAS_PAGO)[number]['id']