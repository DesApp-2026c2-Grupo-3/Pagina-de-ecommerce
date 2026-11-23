const Joi = require('joi');
const { MAX_COMENTARIO } = require('../config/calificaciones');

const idSchema = (nombre) =>
    Joi.number().integer().positive().required().messages({
        'number.base': `${nombre} no es válido`,
        'number.integer': `${nombre} no es válido`,
        'number.positive': `${nombre} no es válido`,
        'any.required': `${nombre} es obligatorio`
    });

const puntaje = Joi.number().integer().min(1).max(5).required().messages({
    'number.base': 'Elegí de 1 a 5 estrellas',
    'number.integer': 'Elegí de 1 a 5 estrellas',
    'number.min': 'Elegí de 1 a 5 estrellas',
    'number.max': 'Elegí de 1 a 5 estrellas',
    'any.required': 'Elegí de 1 a 5 estrellas'
});

// El comentario es opcional: vacío o sin enviar es lo mismo
const comentario = Joi.string().trim().max(MAX_COMENTARIO).allow('', null).messages({
    'string.base': 'El comentario debe ser un texto',
    'string.max': `El comentario no puede superar los ${MAX_COMENTARIO} caracteres`
});

const crearCalificacionSchema = Joi.object({
    usuarioId: idSchema('El usuario'),
    pedidoId: idSchema('El pedido'),
    puntaje,
    comentario
});

module.exports = { crearCalificacionSchema};
