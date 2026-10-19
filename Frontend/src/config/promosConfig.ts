// ⚠️ Pendiente de backend: no hay tabla de promociones. Las promos se definen acá.
// Cada promo dice qué productos suma al carrito. Los productos se buscan por NOMBRE en el
// catálogo real (los ids cambian entre bases): se usa el primer nombre de la lista que exista.
// El descuento es solo una etiqueta: el carrito cobra el precio real de cada producto.

export interface ItemPromo {
  /** Nombres posibles del producto, en orden de preferencia */
  nombres: string[]
  cantidad: number
}

export interface Promo {
  id: string
  /** Lo grande: "2×1", "20% OFF", "+papas" */
  destacado: string
  titulo: string
  detalle: string
  items: ItemPromo[]
}

export interface PromoDelDia extends Promo {
  dia: number // 0 = domingo … 6 = sábado (como Date.getDay())
  corto: string
  nombreDia: string
}

const HAMBURGUESA_CLASICA = ['Fast Classic', 'Hamburguesa Queso', 'Fast Cheese']
const HAMBURGUESA_QUESO = ['Fast Cheese', 'Hamburguesa Queso', 'Fast Classic']
const COMBO = ['Combo Fast Cheese', 'Combo Habemus Bacon', 'Combo Pickle Me Fast']
const BEBIDA = ['Coca Cola', 'Gaseosa Naranja', 'Lima-Limón', 'Agua mineral']
const PAPAS = ['Papas fritas', 'Papas Medianas', 'Papas Rústicas', 'Papas con cheddar']
const NUGGETS = ['Nuggets de Pollo x10', 'Nuggets de Pollo']
const POSTRE = ['Brownie con Helado', 'Helado Sundae', 'Brownie']
const MERIENDA = ['Combo Merienda', 'Merienda Dulce', 'Café y Medialunas']

export const PROMO_ESTRELLA: Promo = {
  id: 'estrella',
  destacado: '20%',
  titulo: 'Duo Carnívoro',
  detalle: 'Para compartir entre dos. Válida todos los días.',
  items: [{ nombres: ['Duo Carnivoro', 'Duo Carnívoro', ...COMBO], cantidad: 1 }],
}

export const PROMOS_SEMANA: PromoDelDia[] = [
  {
    dia: 1, corto: 'Lun', nombreDia: 'lunes', id: 'lunes', destacado: '+bebida',
    titulo: 'Combo + bebida sin cargo',
    detalle: 'Pedí un combo y sumá una bebida más para acompañar.',
    items: [{ nombres: COMBO, cantidad: 1 }, { nombres: BEBIDA, cantidad: 1 }],
  },
  {
    dia: 2, corto: 'Mar', nombreDia: 'martes', id: 'martes', destacado: '2×1',
    titulo: '2×1 en hamburguesas clásicas',
    detalle: 'Llevás dos clásicas y pagás una.',
    items: [{ nombres: HAMBURGUESA_CLASICA, cantidad: 2 }],
  },
  {
    dia: 3, corto: 'Mié', nombreDia: 'miércoles', id: 'miercoles', destacado: '50%',
    titulo: 'Papas a mitad de precio',
    detalle: 'Con cualquier hamburguesa, las papas van a mitad de precio.',
    items: [{ nombres: HAMBURGUESA_QUESO, cantidad: 1 }, { nombres: PAPAS, cantidad: 1 }],
  },
  {
    dia: 4, corto: 'Jue', nombreDia: 'jueves', id: 'jueves', destacado: '10×6',
    titulo: 'Nuggets x10 al precio de x6',
    detalle: 'Diez nuggets de pollo, cuatro van de regalo.',
    items: [{ nombres: NUGGETS, cantidad: 1 }],
  },
  {
    dia: 5, corto: 'Vie', nombreDia: 'viernes', id: 'viernes', destacado: '20%',
    titulo: 'Box familiar con 20% OFF',
    detalle: 'Cuatro hamburguesas, dos papas y cuatro bebidas.',
    items: [
      { nombres: HAMBURGUESA_CLASICA, cantidad: 2 },
      { nombres: HAMBURGUESA_QUESO, cantidad: 2 },
      { nombres: PAPAS, cantidad: 2 },
      { nombres: BEBIDA, cantidad: 4 },
    ],
  },
  {
    dia: 6, corto: 'Sáb', nombreDia: 'sábado', id: 'sabado', destacado: '+postre',
    titulo: 'Postre de regalo desde 2 combos',
    detalle: 'Pedí dos combos y el postre corre por nuestra cuenta.',
    items: [{ nombres: COMBO, cantidad: 2 }, { nombres: POSTRE, cantidad: 1 }],
  },
  {
    dia: 0, corto: 'Dom', nombreDia: 'domingo', id: 'domingo', destacado: '×2',
    titulo: 'Merienda para dos',
    detalle: 'Dos meriendas completas para el domingo.',
    items: [{ nombres: MERIENDA, cantidad: 2 }],
  },
]

export interface PromoCompartir extends Promo {
  etiqueta: string
  tono: 'rojo' | 'mostaza' | 'oscuro'
}

export const PROMOS_COMPARTIR: PromoCompartir[] = [
  { ...PROMOS_SEMANA[1], id: 'compartir-2x1', etiqueta: 'Martes', tono: 'rojo' },
  { ...PROMOS_SEMANA[4], id: 'compartir-box', etiqueta: 'Viernes', tono: 'mostaza' },
  {
    id: 'compartir-nuggets', etiqueta: 'Juntada', tono: 'oscuro', destacado: '+papas',
    titulo: 'Nuggets party',
    detalle: 'Dos porciones de nuggets x10 con papas para el grupo.',
    items: [{ nombres: NUGGETS, cantidad: 2 }, { nombres: PAPAS, cantidad: 2 }],
  },
]