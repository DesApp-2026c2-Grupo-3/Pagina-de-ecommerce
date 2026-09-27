const Joi = require('joi')

const nombre = Joi.string().trim().min(3).max(20).pattern(/^(?=.*\p{L})[\p{L}\p{N}\s]+$/u).required().messages({
    'string.empty': 'El nombre es obligatorio',
    'string.min': 'El nombre debe tener al menos 3 caracteres',
    'string.max': 'El nombre no puede superar los 20 caracteres',
    'string.pattern.base': 'El nombre solo puede contener letras, números y espacios',
    'any.required': 'El nombre es obligatorio'
})

// Siempre en minúsculas y sin espacios: "Juan@Mail.com " y "juan@mail.com" son el mismo email
const email = Joi.string().trim().lowercase().email().required().messages({
    'string.empty': 'El email es obligatorio',
    'string.email': 'El email no tiene un formato válido',
    'any.required': 'El email es obligatorio'
})

const mensajesPassword = {
    'string.empty': 'La contraseña es obligatoria',
    'string.min': 'La contraseña debe tener al menos 6 caracteres',
    'string.max': 'La contraseña no puede superar los 20 caracteres',
    'string.pattern.base': 'La contraseña no puede ser solo espacios',
    'any.required': 'La contraseña es obligatoria'
}

const userSchema = Joi.object({
    nombre,
    email,
    // /\S/ exige al menos un carácter que no sea espacio
    password: Joi.string().min(6).max(20).pattern(/\S/).required().messages(mensajesPassword)
})

const loginSchema = Joi.object({
    email,
    password: Joi.string().min(6).max(20).required().messages(mensajesPassword)
})

const updateSchema = Joi.object({
    nombre,

    apellido: Joi.string().trim().allow('').max(20).messages({
        'string.max': 'El apellido no puede superar los 20 caracteres'
    }),

    email,

    telefono: Joi.string().trim().pattern(/^[0-9+\s-]*$/).allow('').max(20).messages({
        'string.pattern.base': 'El teléfono solo puede contener números, espacios, guiones y el signo +',
        'string.max': 'El teléfono no puede superar los 20 caracteres'
    }),

    // Acepta "30.123.456" y lo guarda como "30123456"
    dni: Joi.string().trim().replace(/\./g, '').pattern(/^[0-9]*$/).allow('').max(15).messages({
        'string.pattern.base': 'El DNI solo puede contener números',
        'string.max': 'El DNI no puede superar los 15 caracteres'
    }),

    // Se valida como fecha, pero se guarda como texto "AAAA-MM-DD" (.raw())
    // para evitar que la zona horaria la corra un día
    fechaNacimiento: Joi.date().iso().max('now').allow('', null).raw().messages({
        'date.base': 'La fecha de nacimiento no es válida',
        'date.format': 'La fecha de nacimiento no es válida',
        'date.max': 'La fecha de nacimiento no puede ser futura'
    }),

    // Vacía = no cambiar la contraseña
    password: Joi.string().min(6).max(20).pattern(/\S/).allow('').messages(mensajesPassword),

    // Si se cambia la contraseña, hay que confirmar la actual
    passwordActual: Joi.when('password', {
        is: Joi.string().min(1).required(),
        then: Joi.string().required().messages({
            'string.empty': 'Ingresá tu contraseña actual para cambiarla',
            'any.required': 'Ingresá tu contraseña actual para cambiarla'
        }),
        otherwise: Joi.string().allow('', null)
    })
})

module.exports = { userSchema, loginSchema, updateSchema }