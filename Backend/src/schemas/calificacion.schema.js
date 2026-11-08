const Joi = require('joi');
const { MAX_COMENTARIO } = require('../config/calificaciones');

const idSchema = (nombre) =>
    Joi.number().integer().positive().required().messages({
        'number.base': `${nombre} no es válido`,
        'number.integer': `${nombre} no es válido`,
        'number.positive': `${nombre} no es válido`,
        'any.required': `${nombre} es obligatorio`
    });

const MENSAJE_ESTRELLAS = 'Elegí de 1 a 5 estrellas';

// Las estrellas son opcionales en cada producto: se puede dejar solo un comentario (o saltearlo)
const puntaje = Joi.number().integer().min(1).max(5).allow(null).messages({
    'number.base': MENSAJE_ESTRELLAS,
    'number.integer': MENSAJE_ESTRELLAS,
    'number.min': MENSAJE_ESTRELLAS,
    'number.max': MENSAJE_ESTRELLAS
});

// El comentario es opcional: vacío o sin enviar es lo mismo
const comentario = Joi.string().trim().max(MAX_COMENTARIO).allow('', null).messages({
    'string.base': 'El comentario debe ser un texto',
    'string.max': `El comentario no puede superar los ${MAX_COMENTARIO} caracteres`
});

// La calificación de un producto del pedido
const itemSchema = Joi.object({
    productoId: idSchema('El producto'),
    puntaje,
    comentario
});

// Un pedido se califica de una vez, producto por producto. Hace falta algo: estrellas o comentario en al menos uno.
const crearCalificacionSchema = Joi.object({
    usuarioId: idSchema('El usuario'),
    pedidoId: idSchema('El pedido'),
    items: Joi.array().items(itemSchema).min(1).unique('productoId').required().messages({
        'array.base': 'Los productos a calificar no son válidos',
        'array.min': 'Calificá al menos un producto o dejá un comentario',
        'array.unique': 'Un producto no se puede calificar dos veces',
        'any.required': 'Calificá al menos un producto o dejá un comentario'
    })
}).custom((value, helpers) => {
    const hayAlgo = value.items.some((item) => item.puntaje != null || item.comentario);
    return hayAlgo ? value : helpers.error('calificacion.vacia');
}).messages({
    'calificacion.vacia': 'Calificá al menos un producto o dejá un comentario'
});

// Corregir la calificación de un producto: sigue necesitando estrellas o comentario
const editarCalificacionSchema = Joi.object({
    usuarioId: idSchema('El usuario'),
    puntaje,
    comentario
}).or('puntaje', 'comentario').messages({
    'object.missing': `${MENSAJE_ESTRELLAS} o dejá un comentario`
});

module.exports = { crearCalificacionSchema, editarCalificacionSchema };
