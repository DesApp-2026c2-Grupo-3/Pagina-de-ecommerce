// Reglas fijas de las promociones de BurgerFast. Las promos en sí ya no están acá: las arma el
// Admin-Master desde el panel (tablas Promociones y PromocionItems) y el front las pide a GET /promociones.
//
// Cada promo suma productos al carrito con su descuento:
//   items: [{ productoId, cantidad, descuento }]   descuento: 0.2 = 20 % menos, 0.5 = mitad, 1 = gratis
//   dias:  días en que vale (0 = domingo … 6 = sábado). Sin "dias" = toda la semana.
//   maxPorPedido: cuántas veces se puede pedir en un mismo pedido (sin límite si no está).
//   compraMinima: lo que tiene que sumar el resto del pedido (sin la promo), en pesos.

const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';

const NOMBRES_DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Dónde se muestra cada promo en la página de Promos
const TIPOS_PROMO = {
  SEMANA: 'SEMANA', // producto de la semana: 20 % menos (o lo que se defina) todos los días
  REGALO: 'REGALO', // regalo de la semana: producto sin cargo, con compra mínima
  DIA: 'DIA',       // promos de cada día
};

// Promos del día que puede haber activas a la vez en un mismo día
const MAX_PROMOS_POR_DIA = 3;

/** Día de la semana de hoy en Argentina (0 = domingo) */
function diaDeHoy(fecha = new Date()) {
  const corto = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: ZONA_HORARIA }).format(fecha);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(corto);
}

// Sin días cargados vale toda la semana
const vigenteHoy = (promo, fecha) => !promo.dias || promo.dias.length === 0 || promo.dias.includes(diaDeHoy(fecha));

/** Precio final de una unidad con descuento (en pesos enteros, igual que el front) */
const aplicarDescuento = (precio, descuento) => Math.round(precio * (1 - descuento));

module.exports = {
  ZONA_HORARIA, NOMBRES_DIAS, TIPOS_PROMO, MAX_PROMOS_POR_DIA,
  diaDeHoy, vigenteHoy, aplicarDescuento,
};
