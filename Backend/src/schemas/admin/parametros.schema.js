const Joi = require('joi');

// Un entero dentro de un rango, con mensajes claros
const entero = (nombre, min, max) => Joi.number().integer().min(min).max(max).required().messages({
    'number.base': `${nombre} debe ser un número`,
    'number.integer': `${nombre} debe ser un número entero`,
    'number.min': `${nombre} no puede ser menor a ${min}`,
    'number.max': `${nombre} no puede ser mayor a ${max}`,
    'any.required': `${nombre} es obligatorio`,
});

// Un número con hasta 2 decimales, dentro de un rango
const decimal = (nombre, min, max) => Joi.number().min(min).max(max).precision(2).required().messages({
    'number.base': `${nombre} debe ser un número`,
    'number.min': `${nombre} no puede ser menor a ${min}`,
    'number.max': `${nombre} no puede ser mayor a ${max}`,
    'any.required': `${nombre} es obligatorio`,
});

const parametrosSchema = Joi.object({
    maxPedidosEnCurso: entero('El máximo de pedidos en curso', 1, 10),

    radioEntregaKm: decimal('El radio de entrega', 1, 30),
    envioBase: decimal('El envío base', 0, 100000),
    envioPorKm: decimal('El envío por km', 0, 100000),

    preparacionBaseMin: entero('La preparación base', 0, 180),
    preparacionPorProductoMin: entero('La preparación por producto', 0, 60),
    viajeMinPorKm: decimal('Los minutos de viaje por km', 0.5, 30),
    margenDemoraMin: entero('El margen por demora', 1, 60),

    diasParaCalificar: entero('Los días para calificar', 1, 60),
    opinionesEnInicio: entero('Las opiniones en el inicio', 0, 24),

    maxPromosPorDia: entero('El máximo de promos por día', 1, 10),
});

module.exports = { parametrosSchema };