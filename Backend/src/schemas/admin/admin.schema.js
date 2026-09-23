const Joi = require('joi')


const adminSchema = Joi.object({
    nombre: Joi.string().trim().min(3).max(20).pattern(/^(?=.*\p{L})[\p{L}\p{N}\s]+$/u).required().messages({
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

    password: Joi.string().min(8).max(20).pattern(/^(?=.*[A-Z])(?=.*[0-9])/).required().messages({
        'string.empty': 'La contraseña es obligatoria',
        'string.min': 'La contraseña debe tener al menos 8 caracteres',
        'string.max': 'La contraseña no puede superar los 20 caracteres',
        'string.pattern.base': 'La contraseña debe tener al menos una mayúscula y un número',
        'any.required': 'La contraseña es obligatoria'
    })
})

const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.empty': 'El email es obligatorio',
        'string.email': 'El email no tiene un formato válido',
        'any.required': 'El email es obligatorio'

    }),

    password: Joi.string().min(8).max(20).pattern(/^(?=.*[A-Z])(?=.*[0-9])/).required().messages({
        'string.empty': 'La contraseña es obligatoria',
        'string.min': 'La contraseña debe tener al menos 8 caracteres',
        'string.max': 'La contraseña no puede superar los 20 caracteres',
        'string.pattern.base': 'La contraseña debe tener al menos una mayúscula y un número',
        'any.required': 'La contraseña es obligatoria'
    })
})

const updateSchema = Joi.object({
    nombre: Joi.string().trim().min(3).max(20).required().messages({
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

    password: Joi.string().min(8).max(20).allow('', null).optional().pattern(/^(?=.*[A-Z])(?=.*[0-9])/).messages({
        'string.min': 'La contraseña debe tener al menos 8 caracteres',
        'string.max': 'La contraseña no puede superar los 20 caracteres',
        'string.pattern.base': 'La contraseña debe tener al menos una mayúscula y un número'
    }),
    passwordActual: Joi.string().allow('', null).optional().messages({
        'string.base': 'La contraseña actual no es válida'
    })
})

module.exports = { adminSchema, loginSchema, updateSchema }