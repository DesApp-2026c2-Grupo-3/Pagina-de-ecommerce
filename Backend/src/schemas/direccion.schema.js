const Joi = require('joi');

// Campos comunes para crear y editar una dirección
const direccionBase = {
    alias: Joi.string()
        .trim()
        .max(30)
        .required()
        .messages({
            'string.empty': 'El alias es obligatorio',
            'string.max': 'El alias no puede superar los 30 caracteres',
            'any.required': 'El alias es obligatorio'
        }),

    calle: Joi.string()
        .trim()
        .max(100)
        .required()
        .messages({
            'string.empty': 'La calle es obligatoria',
            'string.max': 'La calle no puede superar los 100 caracteres',
            'any.required': 'La calle es obligatoria'
        }),

    numero: Joi.string()
        .trim()
        .max(10)
        .pattern(/\d/)
        .required()
        .messages({
            'string.empty': 'La altura es obligatoria',
            'string.max': 'La altura no puede superar los 10 caracteres',
            'string.pattern.base': 'La altura debe contener un número',
            'any.required': 'La altura es obligatoria'
        }),

    piso: Joi.string().trim().max(20).allow('', null).messages({
        'string.max': 'El piso no puede superar los 20 caracteres'
    }),

    localidad: Joi.string()
        .trim()
        .max(100)
        .required()
        .messages({
            'string.empty': 'La localidad es obligatoria',
            'any.required': 'La localidad es obligatoria'
        }),

    provincia: Joi.string()
        .trim()
        .max(100)
        .required()
        .messages({
            'string.empty': 'La provincia es obligatoria',
            'any.required': 'La provincia es obligatoria'
        }),

    codigoPostal: Joi.string().trim().max(10).allow('', null).messages({
        'string.max': 'El código postal no puede superar los 10 caracteres'
    }),

    entreCalles: Joi.string().trim().max(100).allow('', null).messages({
        'string.max': 'Las entre calles no pueden superar los 100 caracteres'
    }),

    observaciones: Joi.string().trim().max(140).allow('', null).messages({
        'string.max': 'Las observaciones no pueden superar los 140 caracteres'
    }),

    // Rango aproximado de Argentina continental
    latitud: Joi.number()
        .min(-55.1)
        .max(-21.7)
        .required()
        .messages({
            'number.base': 'Marcá la ubicación en el mapa',
            'number.min': 'La ubicación debe estar dentro de Argentina',
            'number.max': 'La ubicación debe estar dentro de Argentina',
            'any.required': 'Marcá la ubicación en el mapa'
        }),

    longitud: Joi.number()
        .min(-73.6)
        .max(-53.5)
        .required()
        .messages({
            'number.base': 'Marcá la ubicación en el mapa',
            'number.min': 'La ubicación debe estar dentro de Argentina',
            'number.max': 'La ubicación debe estar dentro de Argentina',
            'any.required': 'Marcá la ubicación en el mapa'
        }),

    predeterminada: Joi.boolean()
        .default(false)
        .messages({
            'boolean.base': 'El campo predeterminada debe ser verdadero o falso'
        })
};

// Al crear, también llega el usuario (hasta que tengamos autenticación con token)
const crearDireccionSchema = Joi.object({
    ...direccionBase,
    usuarioId: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'number.base': 'El ID de usuario debe ser un número',
            'any.required': 'El ID de usuario es obligatorio'
        })
});

// Al editar, no se permite cambiar el usuario dueño de la dirección
const actualizarDireccionSchema = Joi.object(direccionBase);

module.exports = {
    crearDireccionSchema,
    actualizarDireccionSchema
};