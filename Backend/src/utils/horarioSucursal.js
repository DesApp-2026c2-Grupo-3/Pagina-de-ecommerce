// Lógica de horarios de sucursales: zona horaria por sucursal y horario JSON por día.
// El modelo, la migración y el seeder toman las constantes de acá (una sola fuente de verdad).
//
// Estructura de cada día:
//   {
//     abierto: true,
//     turnos: [
//       { apertura: '09:00', cierre: '13:00', cruzaMedianoche: false },
//       { apertura: '17:00', cierre: '01:00', cruzaMedianoche: true }
//     ]
//   }
// Un día cerrado se representa con { abierto: false, turnos: [] }.

const ZONA_HORARIA_POR_DEFECTO = 'America/Argentina/Buenos_Aires';

const DIAS_SEMANA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

// Nombres con acentos para los mensajes de error (las claves del JSON van sin acentos).
const NOMBRE_DIA = {
    lunes: 'lunes',
    martes: 'martes',
    miercoles: 'miércoles',
    jueves: 'jueves',
    viernes: 'viernes',
    sabado: 'sábado',
    domingo: 'domingo',
};

const TURNOS_MAXIMOS = 2;
const MINUTOS_POR_DIA = 24 * 60;

function turnoPorDefecto() {
    return { apertura: '09:00', cierre: '23:00', cruzaMedianoche: false };
}

// Un día completo por defecto: de 09:00 a 23:00, abierto
const HORARIO_POR_DEFECTO = Object.fromEntries(
    DIAS_SEMANA.map((dia) => [dia, { abierto: true, turnos: [turnoPorDefecto()] }])
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
    const dia = DIAS_POR_NOMBRE_EN[valores.weekday];
    const hora = Number(valores.hour);
    const minuto = Number(valores.minute);

    return { dia, minutos: hora * 60 + minuto };
}

// "09:00" -> 540. Formato estricto HH:MM de 00:00 a 23:59
function aMinutos(hhmm) {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(hhmm ?? ''));
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
}

// Valida un turno individual. Devuelve null si es válido o un mensaje de error.
function validarTurno(turno) {
    if (!turno || typeof turno !== 'object' || Array.isArray(turno)) {
        return 'el turno debe ser un objeto';
    }

    const apertura = aMinutos(turno.apertura);
    if (apertura === null) {
        return 'la apertura debe tener formato HH:MM (ej: "09:00")';
    }

    const cierre = aMinutos(turno.cierre);
    if (cierre === null) {
        return 'el cierre debe tener formato HH:MM (ej: "23:00")';
    }

    if (typeof turno.cruzaMedianoche !== 'boolean') {
        return 'debe indicar si cruza la medianoche';
    }

    if (apertura === cierre) {
        return 'el cierre no puede ser igual a la apertura';
    }

    if (turno.cruzaMedianoche) {
        if (turno.cierre === '00:00') {
            return 'el cierre "00:00" no puede estar marcado como cruza medianoche; usalo como fin del día';
        }
        if (cierre >= apertura) {
            return 'está marcado como cruza medianoche pero el cierre no es anterior a la apertura';
        }
        return null;
    }

    // Sin cruce, el cierre "00:00" representa las 24:00 (fin del día).
    if (cierre !== 0 && cierre < apertura) {
        return 'el cierre es anterior a la apertura: marcá "cruzaMedianoche" o corregí el horario';
    }

    return null;
}

// Valida un día completo: estructura, turnos y solapamiento entre sus dos turnos.
function validarDia(dia, config) {
    const nombre = NOMBRE_DIA[dia];

    if (!config || typeof config !== 'object' || Array.isArray(config)) {
        return `Completá el horario del ${nombre}`;
    }

    if (typeof config.abierto !== 'boolean') {
        return `El estado "abierto" del ${nombre} debe ser true o false`;
    }

    if (!Array.isArray(config.turnos)) {
        return `El ${nombre} debe indicar sus turnos`;
    }

    if (config.turnos.length > TURNOS_MAXIMOS) {
        return `El ${nombre} admite como máximo ${TURNOS_MAXIMOS} turnos`;
    }

    if (!config.abierto) {
        if (config.turnos.length > 0) {
            return `El ${nombre} está cerrado y no puede tener turnos`;
        }
        return null;
    }

    if (config.turnos.length === 0) {
        return `El ${nombre} está abierto y debe tener al menos un turno`;
    }

    for (let i = 0; i < config.turnos.length; i++) {
        const error = validarTurno(config.turnos[i]);
        if (error) return `El turno ${i + 1} del ${nombre}: ${error}`;
    }

    if (config.turnos.length === TURNOS_MAXIMOS) {
        const [turno1, turno2] = config.turnos;

        if (turno1.cruzaMedianoche) {
            return `El turno 1 del ${nombre} cruza la medianoche, así que no puede tener un turno 2 el mismo día`;
        }

        const cierre1 = aMinutos(turno1.cierre);
        const cierre1Efectivo = cierre1 === 0 ? MINUTOS_POR_DIA : cierre1;
        const apertura2 = aMinutos(turno2.apertura);

        if (apertura2 <= cierre1Efectivo) {
            return `El turno 2 del ${nombre} debe abrir después del cierre del turno 1 (${turno1.apertura}–${turno1.cierre})`;
        }
    }

    return null;
}

// Si un turno cruza la medianoche, su cierre extendido no puede pisar la apertura del
// primer turno del día siguiente. Se revisan todos los pares, incluido domingo -> lunes.
function validarSolapamientoEntreDias(horario) {
    for (let i = 0; i < DIAS_SEMANA.length; i++) {
        const dia = DIAS_SEMANA[i];
        const siguiente = DIAS_SEMANA[(i + 1) % DIAS_SEMANA.length];
        const config = horario[dia];

        if (config.abierto !== true) continue;

        const nocturno = config.turnos.find((turno) => turno.cruzaMedianoche === true);
        if (!nocturno) continue;

        const cierreExtendido = aMinutos(nocturno.cierre);

        const configSiguiente = horario[siguiente];
        if (configSiguiente.abierto !== true) continue;

        const aperturaSiguiente = aMinutos(configSiguiente.turnos[0].apertura);

        if (aperturaSiguiente <= cierreExtendido) {
            const nombreDia = NOMBRE_DIA[dia];
            const nombreSiguiente = NOMBRE_DIA[siguiente];
            return `El cierre del ${nombreDia} a las ${nocturno.cierre} (+1) se superpone con la apertura del ${nombreSiguiente} a las ${configSiguiente.turnos[0].apertura}. La apertura del ${nombreSiguiente} debe ser posterior a las ${nocturno.cierre}.`;
        }
    }

    return null;
}

// Valida el horario completo. Devuelve null si es válido o el primer mensaje de error.
function validarHorarioSucursal(horario) {
    if (!horario || typeof horario !== 'object' || Array.isArray(horario)) {
        return 'El horario debe ser un objeto con los días de la semana';
    }

    const clavesDesconocidas = Object.keys(horario).filter((clave) => !DIAS_SEMANA.includes(clave));
    if (clavesDesconocidas.length > 0) {
        return `El día "${clavesDesconocidas[0]}" no es válido`;
    }

    for (const dia of DIAS_SEMANA) {
        if (!(dia in horario)) return `Completá el horario del ${NOMBRE_DIA[dia]}`;

        const error = validarDia(dia, horario[dia]);
        if (error) return error;
    }

    return validarSolapamientoEntreDias(horario);
}

// Convierte un turno a un intervalo en minutos. Los turnos nocturnos terminan pasado
// el día (fin > 1440) para poder compararlos con la madrugada del día siguiente.
function intervaloTurno(turno) {
    if (!turno || typeof turno !== 'object' || Array.isArray(turno)) return null;

    const apertura = aMinutos(turno.apertura);
    const cierre = aMinutos(turno.cierre);
    if (apertura === null || cierre === null) return null;

    if (turno.cruzaMedianoche === true) {
        if (cierre === 0 || cierre >= apertura) return null;
        return { inicio: apertura, fin: cierre + MINUTOS_POR_DIA };
    }

    if (cierre === 0) return { inicio: apertura, fin: MINUTOS_POR_DIA };
    if (cierre > apertura) return { inicio: apertura, fin: cierre };

    return null;
}

function formatearTurnos(turnos) {
    return turnos
        .map((turno) => `${turno.apertura} a ${turno.cierre}${turno.cruzaMedianoche ? ' (+1)' : ''}`)
        .join(' y de ');
}

function motivoCerrada(turnos) {
    return `La sucursal se encuentra cerrada en este horario. Atiende de ${formatearTurnos(turnos)}`;
}

// ¿Está abierta en este momento? Devuelve { abierta, motivo }.
// Un horario ausente o incompleto no bloquea (solo se corta con horario explícito de cierre).
function estadoSucursal(horario, zonaHoraria = ZONA_HORARIA_POR_DEFECTO, ahora = new Date()) {
    if (!horario || typeof horario !== 'object' || Array.isArray(horario)) {
        return { abierta: true, motivo: null };
    }

    const { dia, minutos } = obtenerHoraLocal(ahora, zonaHoraria);

    const indice = DIAS_SEMANA.indexOf(dia);
    const config = horario[dia];
    const anterior = DIAS_SEMANA[(indice - 1 + DIAS_SEMANA.length) % DIAS_SEMANA.length];
    const configAnterior = horario[anterior];

    // La madrugada de hoy puede pertenecer al turno nocturno de ayer.
    if (configAnterior && configAnterior.abierto === true && Array.isArray(configAnterior.turnos)) {
        const minutosExtendidos = minutos + MINUTOS_POR_DIA;
        const abiertaPorAyer = configAnterior.turnos.some((turno) => {
            if (!turno || turno.cruzaMedianoche !== true) return false;
            const intervalo = intervaloTurno(turno);
            return intervalo
                && minutosExtendidos >= intervalo.inicio
                && minutosExtendidos < intervalo.fin;
        });

        if (abiertaPorAyer) return { abierta: true, motivo: null };
    }

    if (!config || typeof config !== 'object' || Array.isArray(config)) {
        return { abierta: true, motivo: null };
    }

    // Día incompleto o con turnos inválidos: no hay información confiable, no se bloquea
    if (typeof config.abierto !== 'boolean' || !Array.isArray(config.turnos)) {
        return { abierta: true, motivo: null };
    }

    if (!config.abierto) {
        return { abierta: false, motivo: `La sucursal no atiende los ${NOMBRE_DIA[dia]}` };
    }

    const intervalos = config.turnos.map(intervaloTurno).filter(Boolean);
    if (intervalos.length === 0) {
        return { abierta: true, motivo: null };
    }

    const abiertaAhora = intervalos.some((intervalo) => minutos >= intervalo.inicio && minutos < intervalo.fin);
    if (abiertaAhora) return { abierta: true, motivo: null };

    return { abierta: false, motivo: motivoCerrada(config.turnos) };
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
    validarHorarioSucursal,
    estadoSucursal,
    estaSucursalAbierta,
};
