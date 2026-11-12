const { Op } = require('sequelize');
const { Sucursal, Admin, Insumo, StockSucursal, sequelize } = require('../../models');
const {
    notificarSucursalCerrada,
    notificarSucursalModificadaPorAdmin,
} = require('../../notifications/handlers/sucursalHandlers');
const { detectarBloquesModificados } = require('../../utils/sucursalCambios');
const { motivoSinAcceso, mensajeSinAcceso } = require('../../utils/permisosSucursal');
const { validarHorarioSucursal } = require('../../utils/horarioSucursal');

// Los admins de cada sucursal, solo con los datos que necesita el panel
const ADMINS = { model: Admin, attributes: ['id', 'nombre', 'email'] };

function conAdmins(sucursal) {
    const { Admins, ...datos } = sucursal.toJSON();
    return { ...datos, admins: Admins ?? [] };
}

// ¿Ya hay otra sucursal con ese nombre? (sin distinguir mayúsculas)
async function nombreEnUso(nombre, idPropio = null) {
    const existente = await Sucursal.findOne({ where: { nombre: { [Op.iLike]: nombre } } });
    return Boolean(existente && existente.id !== idPropio);
}

// GET /admin/sucursales → todas, incluidas las inactivas, con sus admins
const obtenerSucursales = async (req, res) => {
    try {
        const sucursales = await Sucursal.findAll({
            include: [ADMINS],
            order: [['activa', 'DESC'], ['nombre', 'ASC']],
        });
        res.status(200).json(sucursales.map(conAdmins));
    } catch (error) {
        console.error('Algo salió mal', error.message);
        res.status(500).json({ mensaje: 'Error al obtener las sucursales' });
    }
};

// GET /admin/sucursales/:id
const obtenerSucursalPorId = async (req, res) => {
    try {
        const sucursal = await Sucursal.findByPk(req.params.id, { include: [ADMINS] });

        if (!sucursal) {
            return res.status(404).json({ mensaje: 'Sucursal no encontrada' });
        }

        const acceso = motivoSinAcceso(req.identidad, sucursal.id);
        if (acceso) {
            return res.status(acceso).json({ mensaje: mensajeSinAcceso(acceso) });
        }

        res.status(200).json(conAdmins(sucursal));
    } catch (error) {
        console.error('Algo salió mal', error.message);
        res.status(500).json({ mensaje: 'Error al obtener la sucursal' });
    }
};

// POST /admin/sucursales/nueva → crea la sucursal y su stock en 0 para todos los insumos
const crearSucursal = async (req, res) => {
    const errorHorario = validarHorarioSucursal(req.body.horario);
    if (errorHorario) {
        return res.status(400).json({ code: errorHorario });
    }

    const t = await sequelize.transaction();

    try {
        if (await nombreEnUso(req.body.nombre)) {
            await t.rollback();
            return res.status(400).json({ code: 'Ya existe una sucursal con ese nombre' });
        }

        const sucursal = await Sucursal.create({ ...req.body, activa: true }, { transaction: t });

        // con el stock mínimo sugerido de cada insumo
        const insumos = await Insumo.findAll({ attributes: ['id', 'stockMinimo'], transaction: t });
        await StockSucursal.bulkCreate(
            insumos.map((insumo) => ({ insumoId: insumo.id, sucursalId: sucursal.id, cantidad: 0, stockMinimo: insumo.stockMinimo ?? null })),
            { transaction: t }
        );

        await t.commit();
        res.status(201).json({ mensaje: 'Sucursal creada con éxito', sucursal });
    } catch (error) {
        await t.rollback();
        console.error('Algo salió mal', error.message);
        res.status(500).json({ mensaje: 'Error al crear la sucursal' });
    }
};

// PATCH /admin/sucursales/editar/:id → edita los datos (no el estado)
const editarSucursal = async (req, res) => {
    if (req.body.horario !== undefined) {
        const errorHorario = validarHorarioSucursal(req.body.horario);
        if (errorHorario) {
            return res.status(400).json({ code: errorHorario });
        }
    }

    try {
        const identidad = req.identidad;

        if (!identidad) {
            return res.status(401).json({ mensaje: 'Acceso no autorizado' });
        }

        const sucursal = await Sucursal.findByPk(req.params.id);

        if (!sucursal) {
            return res.status(404).json({ mensaje: 'Sucursal no encontrada' });
        }

        const esAdminSucursal = identidad.rol === 'ADMIN';

        if (esAdminSucursal && Number(identidad.sucursalId) !== Number(sucursal.id)) {
            return res.status(403).json({ mensaje: 'No puede editar otra sucursal' });
        }

        if (req.body.nombre && await nombreEnUso(req.body.nombre, sucursal.id)) {
            return res.status(400).json({ code: 'Ya existe una sucursal con ese nombre' });
        }

        const anterior = sucursal.toJSON();
        const cambios = detectarBloquesModificados(anterior, req.body);

        await sucursal.update(req.body);

        if (esAdminSucursal && cambios.length > 0) {
            try {
                await notificarSucursalModificadaPorAdmin({
                    sucursalId: sucursal.id,
                    sucursalNombre: sucursal.nombre,
                    adminId: identidad.id,
                    adminNombre: identidad.nombre,
                    cambios,
                });
            } catch (errorNotificacion) {
                console.error('No se pudo notificar la edición de la sucursal:', errorNotificacion.message);
            }
        }

        res.status(200).json({ mensaje: 'Sucursal editada con éxito', sucursal });
    } catch (error) {
        console.error('Algo salió mal', error.message);
        res.status(500).json({ mensaje: 'Error al editar la sucursal' });
    }
};

// PATCH /admin/sucursales/estado/:id → activa o desactiva: { "activa": false }
const cambiarEstadoSucursal = async (req, res) => {
    try {
        const { activa } = req.body;

        if (typeof activa !== 'boolean') {
            return res.status(400).json({ code: 'Indicá si la sucursal queda activa o no' });
        }

        const sucursal = await Sucursal.findByPk(req.params.id);

        if (!sucursal) {
            return res.status(404).json({ mensaje: 'Sucursal no encontrada' });
        }

        const estabaActiva = sucursal.activa;
        await sucursal.update({ activa });

        if (estabaActiva && !activa) {
            await notificarSucursalCerrada({
                sucursalId: sucursal.id,
                sucursalNombre: sucursal.nombre,
            });
        }

        res.status(200).json({
            mensaje: activa ? 'Sucursal activada' : 'Sucursal desactivada',
            sucursal,
        });
    } catch (error) {
        console.error('Algo salió mal', error.message);
        res.status(500).json({ mensaje: 'Error al cambiar el estado de la sucursal' });
    }
};

module.exports = {
    obtenerSucursales,
    obtenerSucursalPorId,
    crearSucursal,
    editarSucursal,
    cambiarEstadoSucursal,
};