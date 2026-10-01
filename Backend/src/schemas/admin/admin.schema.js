const Joi = require('joi')

const nombre = Joi.string().trim().min(3).max(20).pattern(/^(?=.*\p{L})[\p{L}\p{N}\s]+$/u).required().messages({
    'string.empty': 'El nombre es obligatorio',
    'string.min': 'El nombre debe tener al menos 3 caracteres',
    'string.max': 'El nombre no puede superar los 20 caracteres',
    'string.pattern.base': 'El nombre solo puede contener letras, números y espacios',
    'any.required': 'El nombre es obligatorio'
})

// Siempre en minúsculas y sin espacios: "Admin@Burger.com " y "admin@burger.com" son el mismo email
const email = Joi.string().trim().lowercase().email().required().messages({
    'string.empty': 'El email es obligatorio',
    'string.email': 'El email no tiene un formato válido',
    'any.required': 'El email es obligatorio'
})

// Contraseña de admin: al menos 8 caracteres, una mayúscula y un número
const passwordSegura = Joi.string().min(8).max(20).pattern(/^(?=.*[A-Z])(?=.*[0-9])/)

const mensajesPassword = {
    'string.empty': 'La contraseña es obligatoria',
    'string.min': 'La contraseña debe tener al menos 8 caracteres',
    'string.max': 'La contraseña no puede superar los 20 caracteres',
    'string.pattern.base': 'La contraseña debe tener al menos una mayúscula y un número',
    'any.required': 'La contraseña es obligatoria'
}

// La sucursal que gestiona el admin
const sucursalId = Joi.number().integer().positive().messages({
    'number.base': 'La sucursal debe ser un número',
    'number.integer': 'La sucursal no es válida',
    'number.positive': 'La sucursal no es válida',
    'any.required': 'Elegí la sucursal que va a gestionar'
})

// Alta de un admin: siempre es de una sucursal
const adminSchema = Joi.object({
    nombre,
    email,
    password: passwordSegura.required().messages(mensajesPassword),
    sucursalId: sucursalId.required()
})

const loginSchema = Joi.object({
    email,
    password: passwordSegura.required().messages(mensajesPassword)
})

// Edición: la sucursal es opcional (si no viene, queda la que tenía)
const updateSchema = Joi.object({
    nombre,
    email,
    // Vacía o null = no cambiar la contraseña
    password: passwordSegura.allow('', null).optional().messages(mensajesPassword),
    passwordActual: Joi.string().allow('', null).optional().messages({
        'string.base': 'La contraseña actual no es válida'
    }),
    sucursalId: sucursalId.optional()
})

module.exports = { adminSchema, loginSchema, updateSchema }