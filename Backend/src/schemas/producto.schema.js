const Joi = require('joi');

const SABORES = ['cola', 'naranja', 'lima', 'agua'];
const TAMANIOS = ['regular', 'mediano', 'grande'];

// Un insumo de la receta
const itemReceta = Joi.object({
    insumoId: Joi.number().integer().positive().required().messages({
        'number.base': 'Elegí un insumo válido',
        'any.required': 'Cada ingrediente de la receta necesita un insumo'
    }),
    // Cuánto lleva por defecto (0 = no viene incluido, pero se puede agregar)
    cantidadBase: Joi.number().min(0).max(100).precision(3).required().messages({
        'number.base': 'La cantidad del ingrediente debe ser un número',
        'number.min': 'La cantidad del ingrediente no puede ser negativa',
        'number.max': 'La cantidad del ingrediente no puede superar 100',
        'any.required': 'Cada ingrediente necesita una cantidad'
    }),
    esRemovible: Joi.boolean().default(false),
    esAgregable: Joi.boolean().default(false)
});

// Un tamaño del producto, con su precio
const itemTamanio = Joi.object({
    tamanioId: Joi.number().integer().positive().required().messages({
        'number.base': 'Elegí un tamaño válido',
        'any.required': 'Cada tamaño necesita indicar cuál es'
    }),
    precio: Joi.number().positive().precision(2).required().messages({
        'number.base': 'El precio del tamaño debe ser un número',
        'number.positive': 'El precio del tamaño debe ser mayor a 0',
        'any.required': 'Cada tamaño necesita un precio'
    }),
    etiqueta: Joi.string().trim().max(30).allow('', null).messages({
        'string.max': 'La etiqueta del tamaño no puede superar los 30 caracteres'
    }),
    // Cuánto stock gasta respecto de la receta base (1 = igual, 1.5 = 50% más)
    factorStock: Joi.number().positive().max(10).precision(2).default(1).messages({
        'number.positive': 'El factor de stock debe ser mayor a 0',
        'number.max': 'El factor de stock no puede superar 10'
    })
});

// Un lugar del combo (ej: Acompañamiento, Una bebida)
const itemGrupo = Joi.object({
    nombre: Joi.string().trim().min(2).max(40).required().messages({
        'string.empty': 'Cada grupo del combo necesita un nombre',
        'any.required': 'Cada grupo del combo necesita un nombre'
    }),
    categoriaId: Joi.number().integer().positive().required().messages({
        'number.base': 'Elegí la categoría del grupo',
        'any.required': 'Cada grupo necesita una categoría'
    }),
    productoIncluidoId: Joi.number().integer().positive().required().messages({
        'number.base': 'Elegí la opción incluida del grupo',
        'any.required': 'Cada grupo necesita una opción incluida'
    }),
    obligatorio: Joi.boolean().default(true),
    orden: Joi.number().integer().min(1).optional(),
    icono: Joi.string().trim().max(10).allow('', null)
});

const productoSchema = Joi.object({
    nombre: Joi.string().trim().min(3).max(50).required().messages({
        'string.empty': 'El nombre del producto es obligatorio',
        'string.min': 'El nombre debe tener al menos 3 caracteres',
        'string.max': 'El nombre no puede superar los 50 caracteres',
        'any.required': 'El nombre del producto es obligatorio'
    }),

    descripcion: Joi.string().trim().min(3).max(300).required().messages({
        'string.empty': 'La descripción es obligatoria',
        'string.min': 'La descripción debe tener al menos 3 caracteres',
        'string.max': 'La descripción no puede superar los 300 caracteres',
        'any.required': 'La descripción es obligatoria'
    }),

    precio: Joi.number().positive().precision(2).required().messages({
        'number.base': 'El precio debe ser un número válido',
        'number.positive': 'El precio debe ser un valor positivo',
        'any.required': 'El precio es obligatorio'
    }),

    imagen: Joi.string().trim().allow('', null).messages({
        'string.base': 'La imagen debe ser un texto (ruta o URL)'
    }),

    disponible: Joi.boolean().default(true).messages({
        'boolean.base': 'El campo disponible debe ser verdadero o falso'
    }),

    categoriaId: Joi.number().integer().positive().allow(null).optional().messages({
        'number.base': 'El ID de la categoría debe ser un número',
        'number.integer': 'El ID de la categoría debe ser un número entero',
        'number.positive': 'El ID de la categoría debe ser positivo'
    }),

    sabor: Joi.string().valid(...SABORES).allow(null).optional().messages({
        'any.only': 'El sabor debe ser cola, naranja, lima o agua'
    }),

    // Partes del producto. Sin valor por defecto a propósito:
    // al editar, si no vienen, no se tocan.
    receta: Joi.array().items(itemReceta).unique('insumoId').optional().messages({
        'array.unique': 'Un insumo no puede repetirse en la receta'
    }),

    tamanios: Joi.array().items(itemTamanio).unique('tamanioId').optional().messages({
        'array.unique': 'Un tamaño no puede repetirse'
    }),

    grupos: Joi.array().items(itemGrupo).optional()
});

module.exports = {
    productoSchema,
    SABORES,
    TAMANIOS
};