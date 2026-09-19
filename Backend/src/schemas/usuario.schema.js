const Joi = require('joi')


const userSchema = Joi.object({
    nombre:Joi.string().trim().min(3).max(20).pattern(/^(?=.*\p{L})[\p{L}\p{N}\s]+$/u).required().messages({
    'string.empty': 'El nombre es obligatorio',
    'string.min': 'El nombre debe tener al menos 3 caracteres',
    'string.max': 'El nombre no puede superar los 20 caracteres',
    'string.pattern.base': 'El nombre solo puede contener letras, números y espacios',
    'any.required': 'El nombre es obligatorio'
    }),

    email: Joi.string().email().required().messages({
        'string.empty': 'El email es obligatorio',
        'string.email': 'El email no tiene un formato válido',
        'any.required': 'El email es obligatorio'
    }),

    password: Joi.string().min(6).max(20).required().messages({
        'string.empty': 'La contraseña es obligatoria',
        'string.min': 'La contraseña debe tener al menos 6 caracteres',
        'string.max': 'La contraseña no puede superar los 20 caracteres',
        'any.required': 'La contraseña es obligatoria'
    })
})

const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.empty': 'El email es obligatorio',
        'string.email': 'El email no tiene un formato válido',
        'any.required': 'El email es obligatorio'

    }),

    password: Joi.string().min(6).max(20).required().messages({    
        'string.empty': 'La contraseña es obligatoria',
        'string.min': 'La contraseña debe tener al menos 6 caracteres',
        'string.max': 'La contraseña no puede superar los 20 caracteres',
        'any.required': 'La contraseña es obligatoria'        
    })
})

const updateSchema = Joi.object({
    nombre: Joi.string().trim().min(3).max(20).pattern(/^(?=.*\p{L})[\p{L}\p{N}\s]+$/u).required().messages({
        'string.empty': 'El nombre es obligatorio',
        'string.min': 'El nombre debe tener al menos 3 caracteres',
        'string.max': 'El nombre no puede superar los 20 caracteres',
        'string.pattern.base': 'El nombre solo puede contener letras, números y espacios',
        'any.required': 'El nombre es obligatorio'
    }),

    apellido: Joi.string().trim().allow('').max(20).messages({
        'string.max': 'El apellido no puede superar los 20 caracteres'
    }),

    email: Joi.string().email().required().messages({
        'string.empty': 'El email es obligatorio',
        'string.email': 'El email no tiene un formato válido',
        'any.required': 'El email es obligatorio'
    }),

    telefono: Joi.string().trim().pattern(/^[0-9+\s-]*$/).allow('').max(20).messages({
        'string.pattern.base': 'El teléfono solo puede contener números',
        'string.max': 'El teléfono no puede superar los 20 caracteres'
    }),

    dni: Joi.string().trim().pattern(/^[0-9]*$/).allow('').max(15).messages({
        'string.pattern.base': 'El DNI solo puede contener números',
        'string.max': 'El DNI no puede superar los 15 caracteres'
    }),

    fechaNacimiento: Joi.date().allow('', null).messages({
        'date.base': 'La fecha de nacimiento no es válida'
    }),

    password: Joi.string().min(6).max(20).allow('').messages({
        'string.min': 'La contraseña debe tener al menos 6 caracteres',
        'string.max': 'La contraseña no puede superar los 20 caracteres'
    })
})

module.exports = { userSchema, loginSchema, updateSchema }