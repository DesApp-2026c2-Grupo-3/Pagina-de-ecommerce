// Reglas de las calificaciones. Se calculan con la fecha en que el pedido pasó a "Entregado"
// (la línea de tiempo de estados), no con la fecha en que se hizo el pedido.

// Se puede calificar a partir de este tiempo desde la entrega (para que el cliente ya haya probado el pedido)
const MINUTOS_PARA_CALIFICAR = 60;
// ...y hasta este plazo
const DIAS_PARA_CALIFICAR = 7;
// Una calificación se puede corregir durante este tiempo desde que se envió
const HORAS_PARA_EDITAR = 24;
// Máximo del comentario
const MAX_COMENTARIO = 300;

const MS_MINUTO = 60 * 1000;
const MS_HORA = 60 * MS_MINUTO;
const MS_DIA = 24 * MS_HORA;

/** Desde y hasta cuándo se puede calificar un pedido entregado en `entregadoEn` */
const ventanaDeCalificacion = (entregadoEn) => ({
    desde: new Date(new Date(entregadoEn).getTime() + MINUTOS_PARA_CALIFICAR * MS_MINUTO),
    hasta: new Date(new Date(entregadoEn).getTime() + DIAS_PARA_CALIFICAR * MS_DIA),
});

/** 'ANTES' (todavía es pronto), 'ABIERTA' o 'VENCIDA' */
function estadoDeLaVentana(entregadoEn, ahora = new Date()) {
    const { desde, hasta } = ventanaDeCalificacion(entregadoEn);
    if (ahora < desde) return 'ANTES';
    if (ahora > hasta) return 'VENCIDA';
    return 'ABIERTA';
}

/** La calificación enviada en `creada` todavía se puede corregir */
const sePuedeEditar = (creada, ahora = new Date()) =>
    ahora.getTime() - new Date(creada).getTime() <= HORAS_PARA_EDITAR * MS_HORA;

module.exports = {
    MINUTOS_PARA_CALIFICAR,
    DIAS_PARA_CALIFICAR,
    HORAS_PARA_EDITAR,
    MAX_COMENTARIO,
    ventanaDeCalificacion,
    estadoDeLaVentana,
    sePuedeEditar,
};
