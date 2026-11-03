const Joi = require('joi');
const { ICONOS_CATEGORIA, FONDOS_CATEGORIA } = require('../../config/categoriasEstilo');

const slug = Joi.string().pattern(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(40).required().messages({
    'string.pattern.base': 'El identificador solo puede tener minúsculas, números y guiones (por ejemplo: para-acompanar)',
    'string.max': 'El identificador no puede superar los 40 caracteres',
    'string.empty': 'El identificador no puede estar vacío',
    'any.required': 'El identificador es obligatorio'
});

const nombre = (que) => Joi.string().trim().min(2).max(40).required().messages({
    'string.base': `El nombre ${que} debe ser un texto`,
    'string.empty': `El nombre ${que} no puede estar vacío`,
    'string.min': `El nombre ${que} debe tener al menos 2 caracteres`,
    'string.max': `El nombre ${que} no puede superar los 40 caracteres`,
    'any.required': `El nombre ${que} es obligatorio`
});

const id = Joi.number().integer().positive();

const seccionSchema = Joi.object({
    // El panel devuelve los ids que trajo del servidor; el menú se guarda entero, así que no se usan
    id: id.optional(),
    slug,
    nombre: nombre('de la sección'),
    activo: Joi.boolean().default(true),
    icono: Joi.string().valid(...ICONOS_CATEGORIA).allow(null).default(null).messages({ 'any.only': 'El ícono elegido no es válido' }),
    fondo: Joi.string().valid(...FONDOS_CATEGORIA).allow(null).default(null).messages({ 'any.only': 'El color elegido no es válido' }),
    // Todos los productos de esta categoría entran solos en la sección
    categoriaId: id.allow(null).default(null).messages({ 'number.base': 'La categoría de la sección no es válida' }),
    esPorDefecto: Joi.boolean().default(false),
    // Productos puestos a mano: en su grupo, ganan sobre la categoría
    productoIds: Joi.array().items(id).unique().max(60).default([]).messages({
        'array.unique': 'Un producto no puede repetirse en la misma sección',
        'array.max': 'Una sección no puede tener más de 60 productos a mano'
    })
});

const grupoSchema = Joi.object({
    id: id.optional(),
    slug,
    nombre: nombre('del grupo'),
    activo: Joi.boolean().default(true),
    porSecciones: Joi.boolean().default(false),
    categoriaIds: Joi.array().items(id).unique().max(20).default([]).messages({
        'array.unique': 'Una categoría no puede repetirse en el mismo grupo'
    }),
    secciones: Joi.array().items(seccionSchema).max(12).default([]).messages({
        'array.max': 'Un grupo no puede tener más de 12 secciones'
    })
});

// Se manda el menú completo: el orden de los grupos y de las secciones es el de las listas
const menuSchema = Joi.object({
    grupos: Joi.array().items(grupoSchema).min(1).max(20).required().messages({
        'array.min': 'El menú tiene que tener al menos un grupo',
        'array.max': 'El menú no puede tener más de 20 grupos',
        'any.required': 'Falta la lista de grupos del menú'
    })
}).custom((menu, helpers) => {
    const slugsGrupos = menu.grupos.map((g) => g.slug);
    if (new Set(slugsGrupos).size !== slugsGrupos.length) {
        return helpers.message('Dos grupos no pueden tener el mismo identificador');
    }
    for (const grupo of menu.grupos) {
        const slugsSecciones = grupo.secciones.map((s) => s.slug);
        if (new Set(slugsSecciones).size !== slugsSecciones.length) {
            return helpers.message(`Dos secciones de "${grupo.nombre}" no pueden tener el mismo identificador`);
        }
        if (grupo.porSecciones && grupo.secciones.length === 0) {
            return helpers.message(`"${grupo.nombre}" se muestra por secciones pero no tiene ninguna`);
        }
    }
    return menu;
});

module.exports = { menuSchema };
