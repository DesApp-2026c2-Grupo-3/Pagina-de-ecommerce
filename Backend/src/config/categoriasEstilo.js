// Cómo se ve cada categoría en las tarjetas del Home. Los valores son los que entiende el front:
// los íconos son los del set de BurgerFast y los fondos, los tres colores de la marca.
// Si una categoría no tiene ícono o fondo cargado, el front usa el que corresponde a su nombre.
const ICONOS_CATEGORIA = [
    'hamburguesa', 'combo', 'papas', 'nuggets', 'aro', 'bebida', 'postre', 'ensalada',
    'sinTacc', 'desayuno', 'cafe', 'comboCafe', 'sandwich', 'torta', 'salsa', 'generico',
];

const FONDOS_CATEGORIA = ['mostaza', 'rojo', 'arena'];

module.exports = { ICONOS_CATEGORIA, FONDOS_CATEGORIA };
