const { Op } = require('sequelize');
const { Promocion, PromocionItem, Producto, sequelize } = require('../../models');
const { NOMBRES_DIAS, MAX_PROMOS_POR_DIA } = require('../../config/promociones');
const { incluirItems, aPromoAdmin } = require('../../utils/promociones');

// Las promociones las arma y modifica solo el Admin-Master (todas las rutas pasan por esMasterJwt).

class ErrorPromocion extends Error {
    constructor(status, mensaje) {
        super(mensaje);
        this.status = status;
    }
}

// La promo completa, con sus productos (también los eliminados, para avisarlo en el panel)
const cargarPromocion = (id, transaction) =>
    Promocion.findByPk(id, {
        include: incluirItems({ conEliminados: true }),
        order: [[{ model: PromocionItem, as: 'items' }, 'orden', 'ASC']],
        transaction,
    });

// Reglas que necesitan mirar la base. "idActual" es la promo que se está editando (no cuenta contra sí misma).
//  - los productos tienen que existir (y no estar eliminados)
//  - si la promo queda activa: un solo producto de la semana, un solo regalo y hasta MAX_PROMOS_POR_DIA por día
async function validarReglas(datos, idActual, transaction) {
    const ids = datos.items.map((i) => i.productoId);
    const existentes = await Producto.findAll({ where: { id: { [Op.in]: ids } }, attributes: ['id'], transaction });
    if (existentes.length !== ids.length) {
        throw new ErrorPromocion(400, 'Alguno de los productos elegidos no existe o fue eliminado');
    }

    if (!datos.activo) return;

    const otras = await Promocion.findAll({
        where: {
            activo: true,
            ...(idActual ? { id: { [Op.ne]: idActual } } : {}),
        },
        attributes: ['id', 'tipo', 'titulo', 'dias'],
        transaction,
    });

    if (datos.tipo === 'SEMANA' || datos.tipo === 'REGALO') {
        const repetida = otras.find((p) => p.tipo === datos.tipo);
        if (repetida) {
            const que = datos.tipo === 'SEMANA' ? 'producto de la semana' : 'regalo de la semana';
            throw new ErrorPromocion(409, `Ya hay un ${que} activo ("${repetida.titulo}"). Deshabilitalo antes de activar otro.`);
        }
        return;
    }

    for (const dia of datos.dias) {
        const delDia = otras.filter((p) => p.tipo === 'DIA' && (p.dias ?? []).includes(dia));
        if (delDia.length >= MAX_PROMOS_POR_DIA) {
            throw new ErrorPromocion(
                409,
                `El ${NOMBRES_DIAS[dia].toLowerCase()} ya tiene ${MAX_PROMOS_POR_DIA} promos activas. Deshabilitá o cambiá de día alguna antes de sumar otra.`
            );
        }
    }
}

const cabeceraDe = (datos) => ({
    tipo: datos.tipo,
    titulo: datos.titulo,
    destacado: datos.destacado,
    detalle: datos.detalle,
    dias: datos.tipo === 'DIA' ? [...datos.dias].sort((a, b) => a - b) : null,
    maxPorPedido: datos.maxPorPedido ?? null,
    compraMinima: datos.compraMinima ?? null,
    activo: datos.activo,
});

const itemsDe = (datos, promocionId) =>
    datos.items.map((item, indice) => ({
        promocionId,
        productoId: item.productoId,
        cantidad: item.cantidad,
        descuento: item.descuento,
        orden: indice + 1,
    }));

async function revertir(transaction) {
    if (!transaction.finished) await transaction.rollback();
}

const responderError = (res, error, mensajePorDefecto) => {
    if (error instanceof ErrorPromocion) {
        return res.status(error.status).json({ mensaje: error.message });
    }
    console.error(error);
    return res.status(500).json({ mensaje: mensajePorDefecto });
};

const obtenerPromociones = async (req, res) => {
    try {
        const promociones = await Promocion.findAll({
            include: incluirItems({ conEliminados: true }),
            order: [['id', 'ASC']],
        });
        return res.json(promociones.map(aPromoAdmin));
    } catch (error) {
        return responderError(res, error, 'Error al obtener las promociones');
    }
};

const obtenerPromocionPorId = async (req, res) => {
    try {
        const promocion = await cargarPromocion(req.params.id);
        if (!promocion) {
            return res.status(404).json({ mensaje: 'Promoción no encontrada' });
        }
        return res.json(aPromoAdmin(promocion));
    } catch (error) {
        return responderError(res, error, 'Error al obtener la promoción');
    }
};

const crearPromocion = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const datos = req.body;
        await validarReglas(datos, null, t);

        const promocion = await Promocion.create(cabeceraDe(datos), { transaction: t });
        await PromocionItem.bulkCreate(itemsDe(datos, promocion.id), { transaction: t });
        await t.commit();

        const creada = await cargarPromocion(promocion.id);
        return res.status(201).json({
            mensaje: 'Promoción creada con éxito',
            promocion: aPromoAdmin(creada),
        });
    } catch (error) {
        await revertir(t);
        return responderError(res, error, 'Error al crear la promoción');
    }
};

const editarPromocionPorId = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const promocion = await Promocion.findByPk(id, { transaction: t });
        if (!promocion) {
            await t.rollback();
            return res.status(404).json({ mensaje: 'Promoción no encontrada' });
        }

        const datos = req.body;
        await validarReglas(datos, promocion.id, t);

        await promocion.update(cabeceraDe(datos), { transaction: t });
        // Los productos se reemplazan por los que llegan
        await PromocionItem.destroy({ where: { promocionId: promocion.id }, transaction: t });
        await PromocionItem.bulkCreate(itemsDe(datos, promocion.id), { transaction: t });
        await t.commit();

        const editada = await cargarPromocion(promocion.id);
        return res.status(200).json({
            mensaje: 'Promoción editada con éxito',
            promocion: aPromoAdmin(editada),
        });
    } catch (error) {
        await revertir(t);
        return responderError(res, error, 'Error al editar la promoción');
    }
};

const deshabilitarPromocion = async (req, res) => {
    try {
        const promocion = await Promocion.findByPk(req.params.id);
        if (!promocion) {
            return res.status(404).json({ mensaje: 'Promoción no encontrada' });
        }
        if (!promocion.activo) {
            return res.status(400).json({ mensaje: 'La promoción ya está deshabilitada' });
        }

        await promocion.update({ activo: false });
        return res.status(200).json({ mensaje: 'Promoción deshabilitada con éxito' });
    } catch (error) {
        return responderError(res, error, 'Error al deshabilitar la promoción');
    }
};

// Al habilitar se vuelven a controlar las reglas (un solo producto de la semana, máximo por día...)
const habilitarPromocion = async (req, res) => {
    try {
        const promocion = await cargarPromocion(req.params.id);
        if (!promocion) {
            return res.status(404).json({ mensaje: 'Promoción no encontrada' });
        }
        if (promocion.activo) {
            return res.status(400).json({ mensaje: 'La promoción ya está habilitada' });
        }

        await validarReglas(
            {
                tipo: promocion.tipo,
                dias: promocion.dias ?? [],
                activo: true,
                items: promocion.items.map((i) => ({ productoId: i.productoId })),
            },
            promocion.id
        );

        await promocion.update({ activo: true });
        return res.status(200).json({ mensaje: 'Promoción habilitada con éxito' });
    } catch (error) {
        return responderError(res, error, 'Error al habilitar la promoción');
    }
};

// Baja definitiva: los pedidos ya hechos guardan los precios cobrados, no la promo
const eliminarPromocion = async (req, res) => {
    try {
        const promocion = await Promocion.findByPk(req.params.id);
        if (!promocion) {
            return res.status(404).json({ mensaje: 'Promoción no encontrada' });
        }

        await promocion.destroy();
        return res.status(200).json({ mensaje: 'Promoción eliminada con éxito' });
    } catch (error) {
        return responderError(res, error, 'Error al eliminar la promoción');
    }
};

module.exports = {
    obtenerPromociones,
    obtenerPromocionPorId,
    crearPromocion,
    editarPromocionPorId,
    deshabilitarPromocion,
    habilitarPromocion,
    eliminarPromocion,
};
