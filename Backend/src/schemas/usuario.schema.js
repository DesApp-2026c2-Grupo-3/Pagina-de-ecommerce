const Joi = require('joi')


const userSchema = Joi.object({
    nombre:Joi.string().trim().min(3).max(20).pattern(/^(?=.*\p{L})[\p{L}\p{N}]+$/u).required().messages({
        'string.empty': 'El nombre es obligatorio',
        'string.min': 'El nombre debe tener al menos 3 caracteres',
        'string.max': 'El nombre no puede superar los 20 caracteres',
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


module.exports = { userSchema, loginSchema }