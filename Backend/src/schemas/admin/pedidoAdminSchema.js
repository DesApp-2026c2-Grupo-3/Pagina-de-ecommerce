const Joi = require('joi');

// Las 4 etapas válidas del pedido
const estado = Joi.string().valid('Pendiente', 'En proceso', 'En camino', 'Entregado', 'Cancelado').required().messages({
    'string.base': 'El estado debe ser un texto',
    'any.only': 'El estado debe ser uno de: Pendiente, En proceso, En camino, Entregado o Cancelado',
    'any.required': 'El estado es obligatorio'
});

// Esquema completo: disponible para rutas futuras de creación/edición completa
const pedidoAdminSchema = Joi.object({
    usuarioId: Joi.number().integer().positive().required().messages({
        'number.base': 'El id de usuario debe ser un número',
        'number.integer': 'El id de usuario debe ser un número entero',
        'number.positive': 'El id de usuario debe ser un número positivo',
        'any.required': 'El id de usuario es obligatorio'
    }),

    fecha: Joi.date().required().messages({
        'date.base': 'La fecha debe ser una fecha válida',
        'any.required': 'La fecha es obligatoria'
    }),

    total: Joi.number().positive().required().messages({
        'number.base': 'El total debe ser un número',
        'number.positive': 'El total debe ser mayor a 0',
        'any.required': 'El total es obligatorio'
    }),

    direccionId: Joi.number().integer().positive().required().messages({
        'number.base': 'El id de dirección debe ser un número',
        'number.integer': 'El id de dirección debe ser un número entero',
        'number.positive': 'El id de dirección debe ser un número positivo',
        'any.required': 'Tenés que seleccionar una dirección de entrega'
    }),

    sucursalId: Joi.number().integer().positive().required().messages({
        'number.base': 'El id de sucursal debe ser un número',
        'number.integer': 'El id de sucursal debe ser un número entero',
        'number.positive': 'El id de sucursal debe ser un número positivo',
        'any.required': 'Tenés que seleccionar una sucursal'
    }),

    estado
});

// Esquema específico: solo el cambio de estado (PATCH /editar/estado/:id)
const pedidoEstadoAdminSchema = Joi.object({
    estado
});

module.exports = { pedidoAdminSchema, pedidoEstadoAdminSchema };
