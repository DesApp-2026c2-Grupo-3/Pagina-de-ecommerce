// Lógica de horarios de sucursales: zona horaria por sucursal y horario JSON por día.
// El modelo, la migración y el seeder toman las constantes de acá (una sola fuente de verdad).

const ZONA_HORARIA_POR_DEFECTO = 'America/Argentina/Buenos_Aires';

const DIAS_SEMANA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

// Un día completo por defecto: de 09:00 a 23:00, abierto
const HORARIO_POR_DEFECTO = Object.fromEntries(
    DIAS_SEMANA.map((dia) => [dia, { apertura: '09:00', cierre: '23:00', abierto: true }])
);

// Cómo devuelven los nombres de día las Intl en-US, para llevarlos a las claves en español
const DIAS_POR_NOMBRE_EN = {
    Monday: 'lunes',
    Tuesday: 'martes',
    Wednesday: 'miercoles',
    Thursday: 'jueves',
    Friday: 'viernes',
    Saturday: 'sabado',
    Sunday: 'domingo',
};

// ¿La zona es una zona IANA válida? (lanza RangeError si no lo es)
function esZonaHorariaValida(zona) {
    if (typeof zona !== 'string' || !zona.trim()) return false;
    try {
        new Intl.DateTimeFormat('es-AR', { timeZone: zona.trim() });
        return true;
    } catch {
        return false;
    }
}

// Día de la semana y minutos desde 0:00 en la zona horaria indicada (si es inválida, usa la default)
function obtenerHoraLocal(fecha = new Date(), zonaHoraria = ZONA_HORARIA_POR_DEFECTO) {
    const zona = esZonaHorariaValida(zonaHoraria) ? zonaHoraria.trim() : ZONA_HORARIA_POR_DEFECTO;

    const partes = new Intl.DateTimeFormat('en-US', {
        timeZone: zona,
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(fecha);

    const dia = DIAS_POR_NOMBRE_EN[partes.find((p) => p.type === 'weekday')?.value];
    const hora = Number(partes.find((p) => p.type === 'hour')?.value ?? 0);
    const minuto = Number(partes.find((p) => p.type === 'minute')?.value ?? 0);

    return { dia, minutos: hora * 60 + minuto };
}

// "09:00" -> 540. Formato estricto HH:MM de 00:00 a 23:59
function aMinutos(hhmm) {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(hhmm ?? ''));
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
}

// El cierre "00:00" es medianoche: cuenta como el final del día (1440)
function cierreEnMinutos(cierre) {
    const minutos = aMinutos(cierre);
    return minutos === 0 ? 24 * 60 : minutos;
}

// ¿Está abierta en este momento? Devuelve { abierta, motivo }.
// Un horario ausente o incompleto no bloquea (solo se corta con horario explícito de cierre).
function estadoSucursal(horario, zonaHoraria = ZONA_HORARIA_POR_DEFECTO, ahora = new Date()) {
    if (!horario || typeof horario !== 'object' || Array.isArray(horario)) {
        return { abierta: true, motivo: null };
    }

    const { dia, minutos } = obtenerHoraLocal(ahora, zonaHoraria);
    const config = horario[dia];

    if (!config || typeof config !== 'object') {
        return { abierta: true, motivo: null };
    }

    const apertura = aMinutos(config.apertura);
    const cierre = cierreEnMinutos(config.cierre);

    // Día incompleto o con horas inválidas: no hay información confiable, no se bloquea
    if (typeof config.abierto !== 'boolean' || apertura === null || cierre === null) {
        return { abierta: true, motivo: null };
    }

    if (!config.abierto) {
        return { abierta: false, motivo: `La sucursal no atiende los ${dia}` };
    }

    // Si el cierre es anterior a la apertura, es un horario que cruza la medianoche
    const enHorario = cierre > apertura
        ? minutos >= apertura && minutos < cierre
        : minutos >= apertura || minutos < cierre;

    if (!enHorario) {
        return {
            abierta: false,
            motivo: `La sucursal se encuentra cerrada en este horario. Atiende de ${config.apertura} a ${config.cierre}`,
        };
    }

    return { abierta: true, motivo: null };
}

// Versión booleana de estadoSucursal
function estaSucursalAbierta(horario, zonaHoraria = ZONA_HORARIA_POR_DEFECTO, ahora = new Date()) {
    return estadoSucursal(horario, zonaHoraria, ahora).abierta;
}

module.exports = {
    ZONA_HORARIA_POR_DEFECTO,
    HORARIO_POR_DEFECTO,
    DIAS_SEMANA,
    esZonaHorariaValida,
    obtenerHoraLocal,
    estadoSucursal,
    estaSucursalAbierta,
};
