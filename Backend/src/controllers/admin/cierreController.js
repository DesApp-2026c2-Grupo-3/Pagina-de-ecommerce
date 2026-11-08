const { CierreSucursal, Sucursal, Admin, sequelize } = require('../../models');
const { ROLES } = require('../../config/roles');
const { notificar, recortar } = require('../../utils/notificaciones');

const persona = (a) => (a ? { id: a.id, nombre: a.nombre } : null);

const INCLUIR_PERSONAS = [
    { model: Admin, as: 'cerradoPor', attributes: ['id', 'nombre'] },
    { model: Admin, as: 'reabiertoPor', attributes: ['id', 'nombre'] },
];

const datosDe = (c) => c && ({
    id: c.id,
    motivo: c.motivo,
    desde: c.createdAt,
    por: persona(c.cerradoPor),
    reabiertaEn: c.reabiertoEn,
    reabiertaPor: persona(c.reabiertoPor),
});

// Cerrar es solo del encargado de esa sucursal (el master tiene Sucursal.activa para lo definitivo).
// Reabrir lo hace el encargado de esa sucursal o el master, que puede levantar cualquier cierre.
const esEncargadoDe = (usuario, sucursalId) =>
    usuario.rol === ROLES.ADMIN && Number(usuario.sucursalId) === Number(sucursalId);
const puedeReabrir = (usuario, sucursalId) => usuario.rol === ROLES.MASTER || esEncargadoDe(usuario, sucursalId);

// A quién se avisa: el master, los empleados y el otro encargado de esa sucursal (menos quien lo hizo)
async function destinatarios(sucursalId, quienId, transaction) {
    const [masters, equipo] = await Promise.all([
        Admin.findAll({ where: { rol: ROLES.MASTER, activo: true }, attributes: ['id'], transaction }),
        Admin.findAll({ where: { sucursalId, rol: [ROLES.ADMIN, ROLES.EMPLEADO], activo: true }, attributes: ['id'], transaction }),
    ]);
    return [...masters, ...equipo].map((a) => a.id).filter((id) => id !== quienId);
}

// GET /admin/cierres/sucursal/:id — si está cerrada ahora y los últimos cierres
const obtenerEstado = async (req, res) => {
    try {
        const sucursalId = Number(req.params.id);
        const sucursal = await Sucursal.findByPk(sucursalId, { attributes: ['id'] });
        if (!sucursal) {
            return res.status(404).json({ mensaje: 'Sucursal no encontrada' });
        }
        const historial = await CierreSucursal.findAll({
            where: { sucursalId },
            include: INCLUIR_PERSONAS,
            order: [['createdAt', 'DESC']],
            limit: 20,
        });
        const actual = historial.find((c) => !c.reabiertoEn) ?? null;
        res.json({ cerrada: Boolean(actual), cierreActual: datosDe(actual), historial: historial.map(datosDe) });
    } catch (error) {
        console.error('Error al obtener el estado de cierre:', error.message);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

// POST /admin/cierres/sucursal/:id/cerrar   { motivo }
const cerrar = async (req, res) => {
    const sucursalId = Number(req.params.id);
    if (!esEncargadoDe(req.usuario, sucursalId)) {
        return res.status(403).json({ mensaje: 'Solo el encargado de la sucursal puede cerrarla' });
    }

    const t = await sequelize.transaction();
    try {
        const sucursal = await Sucursal.findByPk(sucursalId, { attributes: ['id', 'nombre'], transaction: t });
        if (!sucursal) {
            await t.rollback();
            return res.status(404).json({ mensaje: 'Sucursal no encontrada' });
        }
        const yaCerrada = await CierreSucursal.findOne({ where: { sucursalId, reabiertoEn: null }, attributes: ['id'], transaction: t });
        if (yaCerrada) {
            await t.rollback();
            return res.status(409).json({ code: 'La sucursal ya está cerrada temporalmente' });
        }

        const cierre = await CierreSucursal.create(
            { sucursalId, motivo: req.body.motivo, cerradoPorId: req.usuario.id },
            { transaction: t },
        );
        await notificar(await destinatarios(sucursalId, req.usuario.id, t), {
            tipo: 'CIERRE',
            titulo: `${sucursal.nombre}: cerrada temporalmente`,
            mensaje: recortar(`${req.usuario.nombre}: ${req.body.motivo}`, 300),
        }, t);

        await t.commit();
        return res.status(201).json({ id: cierre.id, cerrada: true });
    } catch (error) {
        await t.rollback();
        console.error('Error al cerrar la sucursal:', error.message);
        return res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

// POST /admin/cierres/sucursal/:id/reabrir
const reabrir = async (req, res) => {
    const sucursalId = Number(req.params.id);
    if (!puedeReabrir(req.usuario, sucursalId)) {
        return res.status(403).json({ mensaje: 'Solo el encargado de la sucursal o el administrador general pueden reabrirla' });
    }

    const t = await sequelize.transaction();
    try {
        const cierre = await CierreSucursal.findOne({ where: { sucursalId, reabiertoEn: null }, transaction: t });
        if (!cierre) {
            await t.rollback();
            return res.status(409).json({ code: 'La sucursal no está cerrada temporalmente' });
        }
        const sucursal = await Sucursal.findByPk(sucursalId, { attributes: ['id', 'nombre'], transaction: t });

        await cierre.update({ reabiertoPorId: req.usuario.id, reabiertoEn: new Date() }, { transaction: t });
        await notificar(await destinatarios(sucursalId, req.usuario.id, t), {
            tipo: 'REAPERTURA',
            titulo: `${sucursal?.nombre ?? 'La sucursal'}: reabierta`,
            mensaje: recortar(
                req.usuario.rol === ROLES.MASTER
                    ? `${req.usuario.nombre} (administración) la reabrió.`
                    : `${req.usuario.nombre} la reabrió.`,
                300,
            ),
        }, t);

        await t.commit();
        return res.json({ cerrada: false });
    } catch (error) {
        await t.rollback();
        console.error('Error al reabrir la sucursal:', error.message);
        return res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

// GET /admin/cierres — los cierres activos: el master ve los de todas las sucursales; el encargado, el de la suya
const listarActivos = async (req, res) => {
    try {
        const where = { reabiertoEn: null };
        if (req.usuario.rol !== ROLES.MASTER) where.sucursalId = req.usuario.sucursalId;

        const cierres = await CierreSucursal.findAll({
            where,
            include: [{ model: Sucursal, attributes: ['id', 'nombre'] }, ...INCLUIR_PERSONAS],
            order: [['createdAt', 'DESC']],
        });
        res.json(cierres.map((c) => ({
            id: c.id,
            sucursal: c.Sucursal ? { id: c.Sucursal.id, nombre: c.Sucursal.nombre } : null,
            motivo: c.motivo,
            desde: c.createdAt,
            por: persona(c.cerradoPor),
        })));
    } catch (error) {
        console.error('Error al listar los cierres:', error.message);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

module.exports = { obtenerEstado, cerrar, reabrir, listarActivos };
