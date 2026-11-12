// Lleva cualquier horario guardado antes al formato actual (ver utils/horarioSucursal.js).
// Lo usan las migraciones y el seeder. Reconoce los formatos viejos:
//   1. el original: { lunes: { apertura, cierre, abierto } }, donde un cierre menor que la apertura
//      pasaba la medianoche y "00:00" era el final del día
//   2. el de turnos: { lunes: { abierto, turnos: [{ apertura, cierre, cruzaMedianoche }] } }.
//      Si un día tenía dos turnos queda una sola franja, de la primera apertura al último cierre.
// Un día que pasaba la medianoche (ej: 18:00 a 02:00) pasa a cerrar a las 23:59 con una transnoche
// de 120 minutos, recortada al tope permitido. Es idempotente.

const { DIAS_SEMANA, HORARIO_POR_DEFECTO, topeTransnoche } = require('./horarioSucursal');

const aMinutos = (hhmm) => {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(hhmm ?? ''));
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

function convertirDia(dia, porDefecto) {
    if (!dia || typeof dia !== 'object' || Array.isArray(dia)) return null;

    // Franja de origen: la del formato original, o del primer al último turno
    const turnos = Array.isArray(dia.turnos) ? dia.turnos.filter((t) => t && aMinutos(t.apertura) !== null && aMinutos(t.cierre) !== null) : null;
    const apertura = turnos ? turnos[0]?.apertura : dia.apertura;
    const ultimo = turnos ? turnos[turnos.length - 1] : dia;
    const cierre = ultimo?.cierre;
    const pasaMedianoche = turnos ? ultimo?.cruzaMedianoche === true : aMinutos(cierre) !== null && aMinutos(cierre) !== 0 && aMinutos(cierre) < aMinutos(apertura);

    // Un día cerrado conserva sus horas (si son válidas) para cuando se vuelva a abrir
    if (dia.abierto === false) {
        const validas = aMinutos(apertura) !== null && aMinutos(cierre) !== null;
        return { abierto: false, apertura: validas ? apertura : porDefecto.apertura, cierre: validas ? cierre : porDefecto.cierre };
    }
    if (aMinutos(apertura) === null || aMinutos(cierre) === null) return null;

    if (pasaMedianoche) {
        const minutos = aMinutos(cierre);
        return { abierto: true, apertura, cierre: '23:59', ...(minutos > 0 ? { transnocheMin: minutos } : {}) };
    }
    if (aMinutos(cierre) === 0) return { abierto: true, apertura, cierre: '23:59' }; // "00:00" era el final del día
    if (aMinutos(cierre) <= aMinutos(apertura)) return null;

    const conserva = cierre === '23:59' && Number.isInteger(dia.transnocheMin) && dia.transnocheMin > 0;
    return { abierto: true, apertura, cierre, ...(conserva ? { transnocheMin: dia.transnocheMin } : {}) };
}

function convertirHorario(valor) {
    let horario = valor;
    if (typeof horario === 'string') {
        try {
            horario = JSON.parse(horario);
        } catch {
            horario = null;
        }
    }
    const objeto = horario && typeof horario === 'object' && !Array.isArray(horario) ? horario : {};

    const semana = Object.fromEntries(
        DIAS_SEMANA.map((dia) => [dia, convertirDia(objeto[dia], HORARIO_POR_DEFECTO[dia]) ?? { ...HORARIO_POR_DEFECTO[dia] }])
    );

    // Recorta cada transnoche al tope que deja el día siguiente (o la quita si no cabe)
    for (const dia of DIAS_SEMANA) {
        const config = semana[dia];
        if (!config.transnocheMin) continue;
        const tope = topeTransnoche(semana, dia);
        if (tope < 1) delete config.transnocheMin;
        else config.transnocheMin = Math.min(config.transnocheMin, tope);
    }

    return semana;
}

module.exports = { convertirHorario };
