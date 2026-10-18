const Joi = require('joi');
const { esZonaHorariaValida, DIAS_SEMANA } = require('../../utils/horarioSucursal');

const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

// Un día del horario: apertura y cierre en formato HH:MM, y si está abierto
const diaSchema = Joi.object({
    apertura: Joi.string().pattern(HORA_REGEX).required().messages({
        'string.pattern.base': 'La apertura debe tener formato HH:MM (ej: "09:00")',
        'any.required': 'Cada día debe indicar la apertura'
    }),

    cierre: Joi.string().pattern(HORA_REGEX).required().messages({
        'string.pattern.base': 'El cierre debe tener formato HH:MM (ej: "23:00")',
        'any.required': 'Cada día debe indicar el cierre'
    }),

    abierto: Joi.boolean().required().messages({
        'boolean.base': 'El estado "abierto" de cada día debe ser true o false',
        'any.required': 'Cada día debe indicar si está abierto'
    })
}).required();

// Los 7 días de la semana, todos obligatorios
const horarioSchema = Joi.object(
    Object.fromEntries(DIAS_SEMANA.map((dia) => [dia, diaSchema]))
).required().messages({
    'object.base': 'El horario debe ser un objeto con los días de la semana'
});

const sucursalSchema = Joi.object({
    nombre: Joi.string().trim().min(3).max(50).required().messages({
        'string.empty': 'El nombre es obligatorio',
        'string.min': 'El nombre debe tener al menos 3 caracteres',
        'string.max': 'El nombre no puede superar los 50 caracteres',
        'any.required': 'El nombre es obligatorio'
    }),

    calle: Joi.string().trim().max(100).required().messages({
        'string.empty': 'La calle es obligatoria',
        'any.required': 'La calle es obligatoria'
    }),

    numero: Joi.string().trim().max(10).pattern(/\d/).required().messages({
        'string.empty': 'La altura es obligatoria',
        'string.pattern.base': 'La altura debe contener un número',
        'any.required': 'La altura es obligatoria'
    }),

    localidad: Joi.string().trim().max(100).required().messages({
        'string.empty': 'La localidad es obligatoria',
        'any.required': 'La localidad es obligatoria'
    }),

    provincia: Joi.string().trim().max(100).required().messages({
        'string.empty': 'La provincia es obligatoria',
        'any.required': 'La provincia es obligatoria'
    }),

    codigoPostal: Joi.string().trim().max(10).allow('', null),

    telefono: Joi.string().trim().pattern(/^[0-9+\s-]*$/).max(20).allow('', null).messages({
        'string.pattern.base': 'El teléfono solo puede contener números, espacios, guiones y el signo +'
    }),

    horario: horarioSchema,

    zona_horaria: Joi.string().trim().max(64).custom((valor, helpers) => {
        if (!esZonaHorariaValida(valor)) {
            return helpers.error('any.invalid');
        }
        return valor;
    }).default('America/Argentina/Buenos_Aires').messages({
        'any.invalid': 'La zona horaria no es válida (usá un identificador IANA, ej: "America/Argentina/Buenos_Aires")'
    }),

    // Rango aproximado de Argentina continental
    latitud: Joi.number().min(-55.1).max(-21.7).required().messages({
        'number.base': 'Marcá la ubicación en el mapa',
        'number.min': 'La ubicación debe estar dentro de Argentina',
        'number.max': 'La ubicación debe estar dentro de Argentina',
        'any.required': 'Marcá la ubicación en el mapa'
    }),

    longitud: Joi.number().min(-73.6).max(-53.5).required().messages({
        'number.base': 'Marcá la ubicación en el mapa',
        'number.min': 'La ubicación debe estar dentro de Argentina',
        'number.max': 'La ubicación debe estar dentro de Argentina',
        'any.required': 'Marcá la ubicación en el mapa'
    }),

    radioEntregaKm: Joi.number().positive().max(30).precision(2).required().messages({
        'number.base': 'El radio de entrega debe ser un número',
        'number.positive': 'El radio de entrega debe ser mayor a 0',
        'number.max': 'El radio de entrega no puede superar los 30 km',
        'any.required': 'El radio de entrega es obligatorio'
    })
});

module.exports = { sucursalSchema };