
const Joi = require('joi');

const nombre = Joi.string()
    .trim()
    .min(3)
    .max(20)
    .pattern(/^(?=.*\p{L})[\p{L}\p{N}\s]+$/u)
    .required()
    .messages({
        'string.empty': 'El nombre es obligatorio',
        'string.min': 'El nombre debe tener al menos 3 caracteres',
        'string.max': 'El nombre no puede superar los 20 caracteres',
        'string.pattern.base': 'El nombre solo puede contener letras, números y espacios',
        'any.required': 'El nombre es obligatorio'
    });

const apellido = nombre.messages({
    'string.empty': 'El apellido es obligatorio',
    'string.min': 'El apellido debe tener al menos 3 caracteres',
    'string.max': 'El apellido no puede superar los 20 caracteres',
    'string.pattern.base': 'El apellido solo puede contener letras, números y espacios',
    'any.required': 'El apellido es obligatorio'
});

const email = Joi.string()
    .trim()
    .lowercase()
    .email()
    .required()
    .messages({
        'string.empty': 'El email es obligatorio',
        'string.email': 'El email no tiene un formato válido',
        'any.required': 'El email es obligatorio'
    });

const password = Joi.string()
    .min(8)
    .max(20)
    .pattern(/^(?=.*[A-Z])(?=.*[0-9])/)
    .required()
    .messages({
        'string.empty': 'La contraseña es obligatoria',
        'string.min': 'La contraseña debe tener al menos 8 caracteres',
        'string.max': 'La contraseña no puede superar los 20 caracteres',
        'string.pattern.base': 'La contraseña debe tener al menos una mayúscula y un número',
        'any.required': 'La contraseña es obligatoria'
    });

const sucursalId = Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
        'number.base': 'La sucursal debe ser un número',
        'number.integer': 'La sucursal no es válida',
        'number.positive': 'La sucursal no es válida',
        'any.required': 'Elegí la sucursal del repartidor'
    });

const repartidorSchema = Joi.object({
    nombre,
    apellido,
    email,
    password,
    sucursalId
});

// Esquema para modificar un repartidor.
const actualizarRepartidorSchema = Joi.object({
    nombre: nombre.optional(),
    apellido: apellido.optional(),
    email: email.optional(),
    password: password.optional().allow(''),
    sucursalId: sucursalId.optional()
}).min(1);

module.exports = {
    repartidorSchema,
    actualizarRepartidorSchema
};

module.exports = { repartidorSchema, actualizarRepartidorSchema };
