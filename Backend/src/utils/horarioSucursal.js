// Horarios de sucursales: zona horaria por sucursal y horario JSON por día.
// El modelo, la migración y el seeder toman las constantes de acá (una sola fuente de verdad).
//
// Cada día:  { abierto, apertura, cierre, transnocheMin? }
//   - Horas de 00:00 a 23:59. "23:59" cuenta como el final del día (24:00).
//   - transnocheMin (opcional, botón "Atención Trasnoche"): minutos que la sucursal sigue abierta
//     después de medianoche. Solo si el día cierra a las 23:59. Tope: una hora antes de que abra
//     el día siguiente (o 06:00 si ese día está cerrado), lo que sea menor.

const ZONA_HORARIA_POR_DEFECTO = 'America/Argentina/Buenos_Aires';

const DIAS_SEMANA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

// Nombres con acentos para los mensajes (las claves del JSON van sin acentos)
const NOMBRE_DIA = {
    lunes: 'lunes',
    martes: 'martes',
    miercoles: 'miércoles',
    jueves: 'jueves',
    viernes: 'viernes',
    sabado: 'sábado',
    domingo: 'domingo',
};

const FIN_DE_DIA = '23:59';
const MINUTOS_POR_DIA = 24 * 60;
const TRANSNOCHE_MAXIMA = 6 * 60; // hasta las 06:00
const ANTELACION_APERTURA = 60; // la transnoche termina al menos 1 hora antes de que abra el día siguiente

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

    const valores = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
    return { dia: DIAS_POR_NOMBRE_EN[valores.weekday], minutos: Number(valores.hour) * 60 + Number(valores.minute) };
}

// "09:00" -> 540. Formato estricto HH:MM de 00:00 a 23:59
function aMinutos(hhmm) {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(hhmm ?? ''));
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

// Minuto en que cierra el día: 23:59 cuenta como las 24:00 (sin hueco antes de la transnoche)
const finDelDia = (cierre) => (cierre === FIN_DE_DIA ? MINUTOS_POR_DIA : aMinutos(cierre));

// 150 -> "+02:30" (el exceso de la transnoche)
function formatearExceso(minutos) {
    const hh = String(Math.floor(minutos / 60)).padStart(2, '0');
    const mm = String(minutos % 60).padStart(2, '0');
    return `+${hh}:${mm}`;
}

// Máximo de minutos de transnoche de un día: una hora antes de que abra el día siguiente, hasta las 06:00
function topeTransnoche(horario, dia) {
    const siguiente = horario[DIAS_SEMANA[(DIAS_SEMANA.indexOf(dia) + 1) % DIAS_SEMANA.length]];
    const apertura = siguiente?.abierto === true ? aMinutos(siguiente.apertura) : null;
    return apertura === null ? TRANSNOCHE_MAXIMA : Math.min(TRANSNOCHE_MAXIMA, apertura - ANTELACION_APERTURA);
}

// Devuelve null si el día es válido, o el mensaje de error
function validarDia(horario, dia) {
    const config = horario[dia];
    const nombre = NOMBRE_DIA[dia];

    if (!config || typeof config !== 'object' || Array.isArray(config)) return `Completá el horario del ${nombre}`;
    if (typeof config.abierto !== 'boolean') return `Indicá si la sucursal atiende el ${nombre}`;

    const apertura = aMinutos(config.apertura);
    const fin = finDelDia(config.cierre);
    if (apertura === null || fin === null) return `Las horas del ${nombre} van de 00:00 a 23:59 (formato HH:MM)`;

    const extra = config.transnocheMin;

    if (!config.abierto) return extra == null ? null : `El ${nombre} está cerrado: no puede tener transnoche`;

    if (fin <= apertura) return `En el ${nombre}, el cierre tiene que ser posterior a la apertura`;

    if (extra == null) return null;

    if (!Number.isInteger(extra) || extra < 1) return `La transnoche del ${nombre} tiene que ser de al menos 1 minuto`;
    if (config.cierre !== FIN_DE_DIA) return `La transnoche del ${nombre} requiere cerrar a las ${FIN_DE_DIA}`;

    const tope = topeTransnoche(horario, dia);
    if (tope < 1) return `El día siguiente abre muy temprano: el ${nombre} no admite transnoche`;
    if (extra > tope) return `La transnoche del ${nombre} puede llegar hasta ${formatearExceso(tope)}`;

    return null;
}

// Devuelve null si el horario semanal es válido, o el mensaje del primer error
function validarHorarioSucursal(horario) {
    if (!horario || typeof horario !== 'object' || Array.isArray(horario)) {
        return 'El horario debe ser un objeto con los días de la semana';
    }
    for (const dia of DIAS_SEMANA) {
        const error = validarDia(horario, dia);
        if (error) return error;
    }
    return null;
}

// "18:00 a 23:59 +02:30"
function formatearDia(config) {
    const horas = `${config.apertura} a ${config.cierre}`;
    return config.transnocheMin ? `${horas} ${formatearExceso(config.transnocheMin)}` : horas;
}

// ¿Está abierta en este momento? Devuelve { abierta, motivo }.
// Un horario ausente o incompleto no bloquea: solo se cierra con un horario explícito.
function estadoSucursal(horario, zonaHoraria = ZONA_HORARIA_POR_DEFECTO, ahora = new Date()) {
    const abierta = { abierta: true, motivo: null };
    if (!horario || typeof horario !== 'object' || Array.isArray(horario)) return abierta;

    const { dia, minutos } = obtenerHoraLocal(ahora, zonaHoraria);

    // La madrugada de hoy puede ser la transnoche de ayer
    const ayer = horario[DIAS_SEMANA[(DIAS_SEMANA.indexOf(dia) + DIAS_SEMANA.length - 1) % DIAS_SEMANA.length]];
    if (ayer?.abierto === true && Number.isInteger(ayer.transnocheMin) && minutos < ayer.transnocheMin) return abierta;

    const config = horario[dia];
    if (!config || typeof config.abierto !== 'boolean') return abierta;

    if (!config.abierto) return { abierta: false, motivo: `La sucursal no atiende los ${NOMBRE_DIA[dia]}` };

    // Horas ausentes o incoherentes: no hay información confiable, no se bloquea
    const inicio = aMinutos(config.apertura);
    const fin = finDelDia(config.cierre);
    if (inicio === null || fin === null || fin <= inicio) return abierta;

    if (minutos >= inicio && minutos < fin) return abierta;

    return {
        abierta: false,
        motivo: `La sucursal se encuentra cerrada en este horario. Atiende de ${formatearDia(config)}`,
    };
}

// Versión booleana de estadoSucursal
function estaSucursalAbierta(horario, zonaHoraria = ZONA_HORARIA_POR_DEFECTO, ahora = new Date()) {
    return estadoSucursal(horario, zonaHoraria, ahora).abierta;
}

module.exports = {
    ZONA_HORARIA_POR_DEFECTO,
    HORARIO_POR_DEFECTO,
    DIAS_SEMANA,
    NOMBRE_DIA,
    esZonaHorariaValida,
    obtenerHoraLocal,
    topeTransnoche,
    formatearExceso,
    validarHorarioSucursal,
    estadoSucursal,
    estaSucursalAbierta,
};
