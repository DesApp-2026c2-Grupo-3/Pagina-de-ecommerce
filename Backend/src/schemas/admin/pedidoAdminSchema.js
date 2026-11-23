const Joi = require('joi');

// Las 4 etapas válidas del pedido
const estado = Joi.string().valid('Pendiente', 'En proceso','Listo para retirar', 'En camino', 'Entregado', 'Cancelado').required().messages({
    'string.base': 'El estado debe ser un texto',
    'any.only': 'El estado debe ser uno de: Pendiente, En proceso,Listo para retirar, En camino, Entregado o Cancelado',
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

// Motivo de la cancelación: obligatorio al cancelar (le llega al cliente en la notificación).
// En los otros estados no se usa y se descarta.
const motivo = Joi.when('estado', {
    is: 'Cancelado',
    then: Joi.string().trim().min(3).max(200).required().messages({
        'string.base': 'El motivo de la cancelación debe ser un texto',
        'string.empty': 'Escribí el motivo de la cancelación: le llega al cliente',
        'string.min': 'El motivo de la cancelación es muy corto (mínimo 3 caracteres)',
        'string.max': 'El motivo de la cancelación no puede superar los 200 caracteres',
        'any.required': 'Escribí el motivo de la cancelación: le llega al cliente'
    }),
    otherwise: Joi.any().strip()
});

// Esquema específico: solo el cambio de estado (PATCH /editar/estado/:id)
const pedidoEstadoAdminSchema = Joi.object({
    estado,
    motivo
}).messages({
    'object.unknown': 'El cambio de estado solo acepta el estado y el motivo de la cancelación'
});

module.exports = { pedidoAdminSchema, pedidoEstadoAdminSchema };
