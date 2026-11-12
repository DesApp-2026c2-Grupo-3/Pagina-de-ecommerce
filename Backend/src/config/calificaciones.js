  // Reglas de las calificaciones.
  // Los días para calificar y las opiniones del inicio son parámetros (se editan desde el admin).
  // Máximo del comentario
const MAX_COMENTARIO = 300;

const MS_DIA = 24 * 60 * 60 * 1000;

  /** true si el pedido hecho en `fechaPedido` todavía se puede calificar (`dias` sale de Parámetros) */
  const dentroDelPlazo = (fechaPedido, dias, ahora = new Date()) =>
      ahora.getTime() - new Date(fechaPedido).getTime() <= dias * MS_DIA;

  module.exports = { MAX_COMENTARIO, dentroDelPlazo };