// Cálculos de la entrega: costo de envío y tiempo estimado. Todos los valores salen de Parametros.

const MS_MINUTO = 60 * 1000;

/** Costo de envío en pesos: base + distancia × precio por km (redondeado) */
const calcularEnvio = (distanciaKm, p) => Math.round(p.envioBase + distanciaKm * p.envioPorKm);

/** Minutos de preparación: una base más un poco por cada unidad pedida */
const minutosPreparacion = (unidades, p) => p.preparacionBaseMin + p.preparacionPorProductoMin * unidades;

/** Minutos de viaje del repartidor */
const minutosViaje = (distanciaKm, p) => Math.ceil(distanciaKm * p.viajeMinPorKm);

/** Tiempo total que se le promete al cliente al hacer el pedido */
const minutosEstimados = (unidades, distanciaKm, p) => minutosPreparacion(unidades, p) + minutosViaje(distanciaKm, p);

const normalizar = (estado) => String(estado ?? '').toLowerCase();

/**
 * Hora aproximada de llegada de un pedido en curso. Se corrige sola si hay demoras:
 *  - Pendiente / En proceso: llega cuando termina la preparación + el viaje.
 *    Si la preparación ya tardó más de lo esperado, se asume que falta el margen (y después el viaje).
 *  - En camino: llega cuando sale + el viaje. Si el viaje ya tardó más, se asume que falta el margen.
 * Devuelve null si el pedido ya terminó (entregado o cancelado).
 */
function estimarLlegada({ fecha, estado, historial = [], unidades, distanciaKm, parametros: p, ahora = new Date() }) {
    const actual = normalizar(estado);
    if (actual === 'entregado' || actual === 'cancelado') return null;

    const viaje = minutosViaje(distanciaKm, p) * MS_MINUTO;
    const margen = p.margenDemoraMin * MS_MINUTO;
    let llegada;
    let demorado = false;

    if (actual === 'en camino') {
        // Desde que salió (si no está registrado, desde ahora)
        const salida = [...historial].reverse().find((h) => normalizar(h.estado) === 'en camino');
        const esperada = new Date(salida ? salida.fecha : ahora).getTime() + viaje;
        demorado = ahora.getTime() > esperada;
        llegada = demorado ? ahora.getTime() + margen : esperada;
    } else {
        const finPreparacion = new Date(fecha).getTime() + minutosPreparacion(unidades, p) * MS_MINUTO;
        demorado = ahora.getTime() > finPreparacion;
        llegada = (demorado ? ahora.getTime() + margen : finPreparacion) + viaje;
    }

    return {
        llegaAprox: new Date(llegada),
        minutosRestantes: Math.max(0, Math.ceil((llegada - ahora.getTime()) / MS_MINUTO)),
        demorado,
    };
}

module.exports = { calcularEnvio, minutosPreparacion, minutosViaje, minutosEstimados, estimarLlegada };