const { Op } = require('sequelize');
const { Insumo, Sucursal, StockSucursal, RecetaInsumo, sequelize } = require('../../models');

// ¿Ya hay otro insumo con ese nombre? (sin distinguir mayúsculas)
async function nombreEnUso(nombre, idPropio = null) {
    const existente = await Insumo.findOne({ where: { nombre: { [Op.iLike]: nombre } } });
    return Boolean(existente && existente.id !== idPropio);
}

// GET /admin/insumos
const obtenerInsumos = async (req, res) => {
    try {
        const insumos = await Insumo.findAll({
            attributes: ['id', 'nombre', 'unidadMedida', 'precioComercial', 'activo'],
            order: [['nombre', 'ASC']],
        });
        res.json(insumos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener los insumos' });
    }
};

// POST /admin/insumos/nuevo → crea el insumo y su stock en 0 en todas las sucursales
const crearInsumo = async (req, res) => {
    if (await nombreEnUso(req.body.nombre)) {
        return res.status(400).json({ code: 'Ya existe un insumo con ese nombre' });
    }

    const t = await sequelize.transaction();
    try {
        const insumo = await Insumo.create(req.body, { transaction: t });

        const sucursales = await Sucursal.findAll({ attributes: ['id'], transaction: t });
        await StockSucursal.bulkCreate(
            sucursales.map((s) => ({ insumoId: insumo.id, sucursalId: s.id, cantidad: 0 })),
            { transaction: t }
        );

        await t.commit();
        res.status(201).json({ mensaje: 'Insumo creado con éxito', insumo });
    } catch (error) {
        await t.rollback();
        console.error(error);
        res.status(500).json({ mensaje: 'Error al crear el insumo' });
    }
};

// PATCH /admin/insumos/editar/:id
const editarInsumo = async (req, res) => {
    try {
        const insumo = await Insumo.findByPk(req.params.id);
        if (!insumo) {
            return res.status(404).json({ mensaje: 'Insumo no encontrado' });
        }

        const { nombre, unidadMedida, precioComercial } = req.body;

        if (nombre !== undefined && await nombreEnUso(nombre, insumo.id)) {
            return res.status(400).json({
                code: 'Ya existe un insumo con ese nombre'
            });
        }

        const cambios = {};

        if (nombre !== undefined) cambios.nombre = nombre;
        if (unidadMedida !== undefined) cambios.unidadMedida = unidadMedida;
        if (precioComercial !== undefined) cambios.precioComercial = precioComercial;

        await insumo.update(cambios);
        res.json({ mensaje: 'Insumo editado con éxito', insumo });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al editar el insumo' });
    }
};

// DELETE /admin/insumos/eliminar/:id → solo si no está en ninguna receta
const eliminarInsumo = async (req, res) => {
    const insumo = await Insumo.findByPk(req.params.id);
    if (!insumo) {
        return res.status(404).json({ mensaje: 'Insumo no encontrado' });
    }

    const enRecetas = await RecetaInsumo.count({ where: { insumoId: insumo.id } });
    if (enRecetas > 0) {
        return res.status(409).json({
            mensaje: `No se puede eliminar: ${insumo.nombre} se usa en ${enRecetas} ${enRecetas === 1 ? 'producto' : 'productos'}. Quitalo de esas recetas primero.`
        });
    }

    const t = await sequelize.transaction();
    try {
        await StockSucursal.destroy({ where: { insumoId: insumo.id }, transaction: t });
        await insumo.destroy({ transaction: t });
        await t.commit();
        res.json({ mensaje: 'Insumo eliminado con éxito' });
    } catch (error) {
        await t.rollback();
        console.error(error);
        res.status(500).json({ mensaje: 'Error al eliminar el insumo' });
    }
};

// PATCH /admin/insumos/:id/deshabilitar
const deshabilitarInsumo = async (req, res) => {
    try {
        const insumo = await Insumo.findByPk(req.params.id);

        if (!insumo) {
            return res.status(404).json({
                mensaje: 'Insumo no encontrado',
            });
        }

        if (!insumo.activo) {
            return res.status(400).json({
                mensaje: 'El insumo ya está deshabilitado',
            });
        }

        await insumo.update({ activo: false });

        return res.status(200).json({
            mensaje: 'Insumo deshabilitado correctamente',
            insumo,
        });
    } catch (error) {
        console.error('Error al deshabilitar insumo:', error.message);
        return res.status(500).json({
            mensaje: 'Error del servidor',
        });
    }
};

// PATCH /admin/insumos/:id/habilitar
const habilitarInsumo = async (req, res) => {
    try {
        const insumo = await Insumo.findByPk(req.params.id);

        if (!insumo) {
            return res.status(404).json({
                mensaje: 'Insumo no encontrado',
            });
        }

        if (insumo.activo) {
            return res.status(400).json({
                mensaje: 'El insumo ya está activo',
            });
        }

        await insumo.update({ activo: true });

        return res.status(200).json({
            mensaje: 'Insumo habilitado correctamente',
            insumo,
        });
    } catch (error) {
        console.error('Error al habilitar insumo:', error.message);
        return res.status(500).json({
            mensaje: 'Error del servidor',
        });
    }
};
module.exports = { obtenerInsumos, crearInsumo, editarInsumo, eliminarInsumo, habilitarInsumo, deshabilitarInsumo };