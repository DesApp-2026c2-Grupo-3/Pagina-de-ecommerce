const Joi = require('joi');

const itemSchema = Joi.object({
    productoId: Joi.number().integer().positive().required().messages({
        'number.base': 'Elegí un producto en cada fila de la promo',
        'number.integer': 'Elegí un producto en cada fila de la promo',
        'number.positive': 'Elegí un producto en cada fila de la promo',
        'any.required': 'Elegí un producto en cada fila de la promo'
    }),
    cantidad: Joi.number().integer().min(1).max(20).required().messages({
        'number.base': 'La cantidad de cada producto debe ser un número',
        'number.integer': 'La cantidad de cada producto debe ser un número entero',
        'number.min': 'La cantidad de cada producto debe ser al menos 1',
        'number.max': 'La cantidad de cada producto no puede superar 20',
        'any.required': 'La cantidad de cada producto es obligatoria'
    }),
    // 0.2 = 20 % menos, 0.5 = mitad de precio, 1 = gratis, 0 = va a precio de lista
    descuento: Joi.number().min(0).max(1).precision(3).required().messages({
        'number.base': 'El descuento de cada producto debe ser un número',
        'number.min': 'El descuento no puede ser negativo',
        'number.max': 'El descuento no puede superar el 100 %',
        'any.required': 'El descuento de cada producto es obligatorio (0 si va a precio de lista)'
    })
});

const promocionSchema = Joi.object({
    tipo: Joi.string().valid('SEMANA', 'REGALO', 'DIA').required().messages({
        'any.only': 'El tipo de promoción debe ser SEMANA, REGALO o DIA',
        'any.required': 'El tipo de promoción es obligatorio',
        'string.base': 'El tipo de promoción no es válido'
    }),
    titulo: Joi.string().trim().min(3).max(60).required().messages({
        'string.base': 'El título debe ser un texto',
        'string.empty': 'El título no puede estar vacío',
        'string.min': 'El título debe tener al menos 3 caracteres',
        'string.max': 'El título no puede superar los 60 caracteres',
        'any.required': 'El título es obligatorio'
    }),
    destacado: Joi.string().trim().min(1).max(10).required().messages({
        'string.base': 'Lo destacado debe ser un texto',
        'string.empty': 'Lo destacado (lo que va en el círculo) no puede estar vacío',
        'string.max': 'Lo destacado no puede superar los 10 caracteres',
        'any.required': 'Lo destacado (lo que va en el círculo) es obligatorio'
    }),
    detalle: Joi.string().trim().min(5).max(200).required().messages({
        'string.base': 'El detalle debe ser un texto',
        'string.empty': 'El detalle no puede estar vacío',
        'string.min': 'El detalle debe tener al menos 5 caracteres',
        'string.max': 'El detalle no puede superar los 200 caracteres',
        'any.required': 'El detalle es obligatorio'
    }),
    // Solo las promos del día: 0 = domingo … 6 = sábado
    dias: Joi.array().items(Joi.number().integer().min(0).max(6)).unique().allow(null).messages({
        'array.base': 'Los días deben ser una lista',
        'array.unique': 'Un día no puede repetirse',
        'number.base': 'Los días deben ser números del 0 (domingo) al 6 (sábado)',
        'number.min': 'Los días van del 0 (domingo) al 6 (sábado)',
        'number.max': 'Los días van del 0 (domingo) al 6 (sábado)'
    }),
    maxPorPedido: Joi.number().integer().min(1).max(10).allow(null).messages({
        'number.base': 'El máximo por pedido debe ser un número',
        'number.integer': 'El máximo por pedido debe ser un número entero',
        'number.min': 'El máximo por pedido debe ser al menos 1',
        'number.max': 'El máximo por pedido no puede superar 10'
    }),
    compraMinima: Joi.number().integer().min(0).max(1000000).allow(null).messages({
        'number.base': 'La compra mínima debe ser un número',
        'number.integer': 'La compra mínima debe ser un número entero',
        'number.min': 'La compra mínima no puede ser negativa',
        'number.max': 'La compra mínima no puede superar $1.000.000'
    }),
    activo: Joi.boolean().default(true).messages({
        'boolean.base': 'El estado de la promoción no es válido'
    }),
    items: Joi.array().items(itemSchema).min(1).max(8).required().messages({
        'array.base': 'Los productos de la promo deben ser una lista',
        'array.min': 'La promo tiene que incluir al menos un producto',
        'array.max': 'Una promo no puede incluir más de 8 productos',
        'any.required': 'La promo tiene que incluir al menos un producto'
    })
}).custom((promo, helpers) => {
    // Reglas que dependen del tipo de promo
    const ids = promo.items.map((i) => i.productoId);
    if (new Set(ids).size !== ids.length) {
        return helpers.message('Un producto no puede repetirse en la misma promo (subí la cantidad en su fila)');
    }
    if (!promo.items.some((i) => i.descuento > 0)) {
        return helpers.message('Al menos un producto de la promo tiene que tener descuento');
    }

    const tieneDias = Array.isArray(promo.dias) && promo.dias.length > 0;
    const tieneLimites = promo.maxPorPedido != null || promo.compraMinima != null;

    if (promo.tipo === 'DIA' && !tieneDias) {
        return helpers.message('Elegí al menos un día para la promo');
    }
    if (promo.tipo !== 'DIA' && tieneDias) {
        return helpers.message('Solo las promos del día se eligen por día: el producto y el regalo de la semana valen toda la semana');
    }
    if (promo.tipo === 'SEMANA') {
        if (promo.items.length !== 1 || promo.items[0].cantidad !== 1) {
            return helpers.message('El producto de la semana es un solo producto, de a una unidad');
        }
        if (tieneLimites) {
            return helpers.message('El producto de la semana no lleva máximo por pedido ni compra mínima');
        }
    }
    if (promo.tipo === 'REGALO' && promo.items.some((i) => i.descuento !== 1)) {
        return helpers.message('En el regalo de la semana todos los productos van sin cargo (descuento del 100 %)');
    }

    return promo;
});

module.exports = { promocionSchema };
