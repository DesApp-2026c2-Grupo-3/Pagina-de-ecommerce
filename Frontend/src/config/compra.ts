// ⚠️ Pendiente de backend: el costo de envío y los cupones todavía no existen en el servidor.
// Cuando estén, estos valores se reemplazan por lo que devuelva la API.

/** Costo de envío fijo. null = todavía no se calcula (se muestra "A calcular") */
export const COSTO_ENVIO: number | null = null

/** false = el campo de cupón se muestra, pero avisa que todavía no está disponible */
export const CUPONES_HABILITADOS = false


// Opciones del checkout. "disponible: false" = se muestran, pero todavía no se pueden elegir.
export const FORMAS_ENTREGA = [
  { id: 'envio', titulo: 'Envío a domicilio', detalle: 'Te lo llevamos a tu dirección', disponible: true },
  { id: 'retiro', titulo: 'Retiro en sucursal', detalle: 'Pasás a buscarlo vos', disponible: false },
] as const

export const FORMAS_PAGO = [
  { id: 'efectivo', titulo: 'Efectivo', detalle: 'Pagás al recibir', disponible: true },
  { id: 'mercadopago', titulo: 'Mercado Pago', detalle: 'Dinero en cuenta o tarjeta', disponible: false },
  { id: 'tarjeta', titulo: 'Tarjeta', detalle: 'Débito o crédito al recibir', disponible: false },
] as const

export type FormaEntrega = (typeof FORMAS_ENTREGA)[number]['id']
export type FormaPago = (typeof FORMAS_PAGO)[number]['id']