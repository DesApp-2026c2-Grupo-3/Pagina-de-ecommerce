// Reglas de las calificaciones

// Se puede calificar un pedido entregado hasta esta cantidad de días después de hecho
const DIAS_PARA_CALIFICAR = 7;
// Máximo del comentario
const MAX_COMENTARIO = 300;

const MS_DIA = 24 * 60 * 60 * 1000;

/** true si el pedido hecho en `fechaPedido` todavía se puede calificar */
const dentroDelPlazo = (fechaPedido, ahora = new Date()) =>
    ahora.getTime() - new Date(fechaPedido).getTime() <= DIAS_PARA_CALIFICAR * MS_DIA;

module.exports = { DIAS_PARA_CALIFICAR, MAX_COMENTARIO, dentroDelPlazo };