// Promociones de BurgerFast. ÚNICA fuente: el front las pide a GET /promociones y el pedido las valida acá.
// No hay tabla en la base: para cambiar una promo se edita este archivo.
//
// Cada promo suma productos al carrito con su descuento:
//   items: [{ nombre, cantidad, descuento }]   descuento: 0.2 = 20 % menos, 0.5 = mitad, 1 = gratis
//   dias:  días en que vale (0 = domingo … 6 = sábado). Sin "dias" = toda la semana.
//   maxPorPedido: cuántas veces se puede pedir en un mismo pedido (sin límite si no está).
// Los productos se buscan por NOMBRE exacto del catálogo.

const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';

const NOMBRES_DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Producto de la semana: 20 % menos todos los días, pedido desde cualquier lado
const PRODUCTO_SEMANA = {
  id: 'producto-semana',
  titulo: 'Combo Habemus Bacon',
  destacado: '20%',
  detalle: 'El más pedido de la casa, con 20 % menos toda la semana.',
  items: [{ nombre: 'Combo Habemus Bacon', cantidad: 1, descuento: 0.2 }],
};

// Regalo de la semana: unas papas con cheddar sin cargo, una por pedido
const REGALO = {
  id: 'papas-cheddar-gratis',
  titulo: 'Papas con cheddar gratis',
  destacado: 'Gratis',
  detalle: 'Toda la semana, sumá unas papas con cheddar sin cargo a tu pedido.',
  maxPorPedido: 1,
  items: [{ nombre: 'Papas con cheddar', cantidad: 1, descuento: 1 }],
};

// Tres promos por día
const PROMOS_DEL_DIA = [
  // Lunes
  { id: 'lun-clasico', dias: [1], destacado: '25%', titulo: 'Lunes clásico',
    detalle: 'El Combo Fast Classic con 25 % menos para arrancar la semana.',
    items: [{ nombre: 'Combo Fast Classic', cantidad: 1, descuento: 0.25 }] },
  { id: 'lun-doble-queso', dias: [1], destacado: '20%', titulo: 'Doble queso',
    detalle: 'La Doble Fast Cheese con 20 % menos.',
    items: [{ nombre: 'Doble Fast Cheese', cantidad: 1, descuento: 0.2 }] },
  { id: 'lun-cafe', dias: [1], destacado: '30%', titulo: 'Café y medialunas',
    detalle: 'Un latte y dos medialunas con 30 % menos.',
    items: [{ nombre: 'Latte', cantidad: 1, descuento: 0.3 }, { nombre: 'Medialunas x2', cantidad: 1, descuento: 0.3 }] },

  // Martes
  { id: 'mar-2x1-clasica', dias: [2], destacado: '2×1', titulo: 'Martes de 2×1',
    detalle: 'Llevás dos Fast Classic y pagás una.',
    items: [{ nombre: 'Fast Classic', cantidad: 2, descuento: 0.5 }] },
  { id: 'mar-2x1-crispy', dias: [2], destacado: '2×1', titulo: '2×1 Crispy',
    detalle: 'Dos Crispy Crack al precio de una.',
    items: [{ nombre: 'Crispy Crack', cantidad: 2, descuento: 0.5 }] },
  { id: 'mar-nuggets', dias: [2], destacado: '25%', titulo: 'Nuggets con papas',
    detalle: 'Nuggets x10 y papas fritas con 25 % menos.',
    items: [{ nombre: 'Nuggets de Pollo x10', cantidad: 1, descuento: 0.25 }, { nombre: 'Papas fritas', cantidad: 1, descuento: 0.25 }] },

  // Miércoles
  { id: 'mie-papas', dias: [3], destacado: '50%', titulo: 'Papas a mitad de precio',
    detalle: 'Con tu Fast Cheese, las papas con cheddar van a mitad de precio.',
    items: [{ nombre: 'Fast Cheese', cantidad: 1, descuento: 0 }, { nombre: 'Papas con cheddar', cantidad: 1, descuento: 0.5 }] },
  { id: 'mie-spicy', dias: [3], destacado: '20%', titulo: 'Miércoles picante',
    detalle: 'El Combo Spicy Fast con 20 % menos.',
    items: [{ nombre: 'Combo Spicy Fast', cantidad: 1, descuento: 0.2 }] },
  { id: 'mie-aros', dias: [3], destacado: '30%', titulo: 'Aros y gaseosa',
    detalle: 'Aros de cebolla x8 y una Coca Cola con 30 % menos.',
    items: [{ nombre: 'Aros de Cebolla x8', cantidad: 1, descuento: 0.3 }, { nombre: 'Coca Cola', cantidad: 1, descuento: 0.3 }] },

  // Jueves
  { id: 'jue-green', dias: [4], destacado: '25%', titulo: 'Jueves verde',
    detalle: 'La Fast Green con 25 % menos.',
    items: [{ nombre: 'Fast Green', cantidad: 1, descuento: 0.25 }] },
  { id: 'jue-duo', dias: [4], destacado: '20%', titulo: 'Dúo de combos',
    detalle: 'Dos Combo Fast Cheese con 20 % menos cada uno.',
    items: [{ nombre: 'Combo Fast Cheese', cantidad: 2, descuento: 0.2 }] },
  { id: 'jue-picantes', dias: [4], destacado: '2×1', titulo: '2×1 en picantes',
    detalle: 'Dos porciones de Nuggets Picantes x6 al precio de una.',
    items: [{ nombre: 'Nuggets Picantes x6', cantidad: 2, descuento: 0.5 }] },

  // Viernes
  { id: 'vie-box', dias: [5], destacado: '20%', titulo: 'Box familiar',
    detalle: 'Cuatro hamburguesas, dos papas y cuatro bebidas con 20 % menos.',
    items: [
      { nombre: 'Fast Classic', cantidad: 2, descuento: 0.2 },
      { nombre: 'Fast Cheese', cantidad: 2, descuento: 0.2 },
      { nombre: 'Papas fritas', cantidad: 2, descuento: 0.2 },
      { nombre: 'Coca Cola', cantidad: 4, descuento: 0.2 },
    ] },
  { id: 'vie-magnum', dias: [5], destacado: '20%', titulo: 'Viernes Magnum',
    detalle: 'El Combo Magnum Fast con 20 % menos.',
    items: [{ nombre: 'Combo Magnum Fast', cantidad: 1, descuento: 0.2 }] },
  { id: 'vie-bebida', dias: [5], destacado: 'Gratis', titulo: 'Bebida de regalo',
    detalle: 'Pedí el Combo Blue Fast y te regalamos una Sprite.',
    items: [{ nombre: 'Combo Blue Fast', cantidad: 1, descuento: 0 }, { nombre: 'Sprite', cantidad: 1, descuento: 1 }] },

  // Sábado
  { id: 'sab-bestia', dias: [6], destacado: '20%', titulo: 'Sábado bestia',
    detalle: 'El Combo Bestia Fast con 20 % menos.',
    items: [{ nombre: 'Combo Bestia Fast', cantidad: 1, descuento: 0.2 }] },
  { id: 'sab-pollo', dias: [6], destacado: '25%', titulo: 'Pollo para compartir',
    detalle: 'Pollo frito y papas rústicas con 25 % menos.',
    items: [{ nombre: 'Pollo Frito', cantidad: 1, descuento: 0.25 }, { nombre: 'Papas Rústicas', cantidad: 1, descuento: 0.25 }] },
  { id: 'sab-mushroom', dias: [6], destacado: '50%', titulo: 'Mushroom con cajún',
    detalle: 'Con el Combo Fast Mushroom, las papas cajún van a mitad de precio.',
    items: [{ nombre: 'Combo Fast Mushroom', cantidad: 1, descuento: 0 }, { nombre: 'Papas Cajún', cantidad: 1, descuento: 0.5 }] },

  // Domingo
  { id: 'dom-desayuno', dias: [0], destacado: '30%', titulo: 'Desayuno para dos',
    detalle: 'Dos Desayunos Americanos con 30 % menos.',
    items: [{ nombre: 'Desayuno Americano', cantidad: 2, descuento: 0.3 }] },
  { id: 'dom-merienda', dias: [0], destacado: '25%', titulo: 'Merienda de domingo',
    detalle: 'Dos latte y unos hot cakes con 25 % menos.',
    items: [{ nombre: 'Latte', cantidad: 2, descuento: 0.25 }, { nombre: 'Hot Cakes', cantidad: 1, descuento: 0.25 }] },
  { id: 'dom-habemus', dias: [0], destacado: '25%', titulo: 'Domingo de combos',
    detalle: 'El Combo Doble Habemus con 25 % menos.',
    items: [{ nombre: 'Combo Doble Habemus', cantidad: 1, descuento: 0.25 }] },
];

const TODAS = [PRODUCTO_SEMANA, REGALO, ...PROMOS_DEL_DIA];

/** Día de la semana de hoy en Argentina (0 = domingo) */
function diaDeHoy(fecha = new Date()) {
  const corto = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: ZONA_HORARIA }).format(fecha);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(corto);
}

const vigenteHoy = (promo, fecha) => !promo.dias || promo.dias.includes(diaDeHoy(fecha));
const buscarPromo = (id) => TODAS.find((p) => p.id === id) ?? null;

/** Precio final de una unidad con descuento (en pesos enteros, igual que el front) */
const aplicarDescuento = (precio, descuento) => Math.round(precio * (1 - descuento));

module.exports = {
  ZONA_HORARIA, NOMBRES_DIAS, PRODUCTO_SEMANA, REGALO, PROMOS_DEL_DIA, TODAS,
  diaDeHoy, vigenteHoy, buscarPromo, aplicarDescuento,
};
