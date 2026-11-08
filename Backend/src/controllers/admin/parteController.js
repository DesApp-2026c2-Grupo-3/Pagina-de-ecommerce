const { Parte, Notificacion, Admin, Producto, Pedido, sequelize } = require('../../models');
const { ROLES } = require('../../config/roles');
const { notificar, recortar } = require('../../utils/notificaciones');

const TIPO_TEXTO = { EQUIPO: 'Equipo roto', INSUMO: 'Falta de insumo', PEDIDO: 'Problema con un pedido', OTRO: 'Otro' };

const persona = (a) => (a ? { id: a.id, nombre: a.nombre } : null);

// POST /admin/partes — solo el empleado. Va a los encargados activos de su sucursal.
const crear = async (req, res) => {
    const sucursalId = req.usuario.sucursalId;
    if (!sucursalId) {
        return res.status(400).json({ code: 'No tenés una sucursal asignada' });
    }
    const { tipo, descripcion, urgencia, productoIds = [], pedidoId = null } = req.body;

    const t = await sequelize.transaction();
    try {
        if (productoIds.length > 0) {
            const existentes = await Producto.findAll({ where: { id: productoIds }, attributes: ['id'], transaction: t });
            if (existentes.length !== productoIds.length) {
                await t.rollback();
                return res.status(404).json({ code: 'Alguno de los productos no existe' });
            }
        }
        if (pedidoId) {
            const pedido = await Pedido.findByPk(pedidoId, { attributes: ['id', 'sucursalId'], transaction: t });
            if (!pedido || Number(pedido.sucursalId) !== Number(sucursalId)) {
                await t.rollback();
                return res.status(404).json({ code: 'Ese pedido no es de tu sucursal' });
            }
        }

        const parte = await Parte.create(
            { sucursalId, creadoPorId: req.usuario.id, tipo, descripcion, urgencia, productoIds, pedidoId },
            { transaction: t },
        );

        const encargados = await Admin.findAll({
            where: { rol: ROLES.ADMIN, sucursalId, activo: true },
            attributes: ['id'],
            transaction: t,
        });
        const avisados = await notificar(encargados.map((e) => e.id), {
            tipo: 'PARTE',
            titulo: urgencia === 'URGENTE' ? '¡Parte urgente!' : 'Nuevo parte',
            mensaje: recortar(`${req.usuario.nombre}: ${TIPO_TEXTO[tipo]}. ${descripcion}`, 300),
            parteId: parte.id,
        }, t);

        await t.commit();
        return res.status(201).json({ id: parte.id, avisados });
    } catch (error) {
        await t.rollback();
        console.error('Error al crear el parte:', error.message);
        return res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

// GET /admin/partes?estado=pendientes|resueltos&sucursalId=
// El empleado ve los suyos; el encargado, los de su sucursal; el master puede ver todos (solo lectura).
const listar = async (req, res) => {
    try {
        const where = {};
        if (req.usuario.rol === ROLES.EMPLEADO) where.creadoPorId = req.usuario.id;
        else if (req.usuario.rol === ROLES.ADMIN) where.sucursalId = req.usuario.sucursalId;
        else if (req.query.sucursalId) where.sucursalId = Number(req.query.sucursalId);

        if (req.query.estado === 'pendientes') where.estado = ['ENVIADO', 'VISTO'];
        else if (req.query.estado === 'resueltos') where.estado = 'RESUELTO';

        const partes = await Parte.findAll({
            where,
            include: [
                { model: Admin, as: 'creadoPor', attributes: ['id', 'nombre'] },
                { model: Admin, as: 'vistoPor', attributes: ['id', 'nombre'] },
                { model: Admin, as: 'resueltoPor', attributes: ['id', 'nombre'] },
            ],
            order: [['createdAt', 'DESC']],
            limit: 100,
        });

        const ids = [...new Set(partes.flatMap((p) => p.productoIds ?? []))];
        const productos = ids.length > 0
            ? await Producto.findAll({ where: { id: ids }, attributes: ['id', 'nombre'], paranoid: false })
            : [];
        const nombrePorId = new Map(productos.map((p) => [p.id, p.nombre]));

        res.json(partes.map((p) => ({
            id: p.id,
            sucursalId: p.sucursalId,
            tipo: p.tipo,
            descripcion: p.descripcion,
            urgencia: p.urgencia,
            estado: p.estado,
            pedidoId: p.pedidoId,
            productos: (p.productoIds ?? []).map((id) => ({ id, nombre: nombrePorId.get(id) ?? 'Producto eliminado' })),
            creadoPor: persona(p.creadoPor),
            creadoEn: p.createdAt,
            vistoPor: persona(p.vistoPor),
            vistoEn: p.vistoEn,
            resueltoPor: persona(p.resueltoPor),
            resueltoEn: p.resueltoEn,
            nota: p.nota,
        })));
    } catch (error) {
        console.error('Error al listar los partes:', error.message);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

// PATCH /admin/partes/:id/resolver   { nota }  — solo un encargado de la sucursal del parte
const resolver = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const parte = await Parte.findByPk(req.params.id, { transaction: t });
        if (!parte) {
            await t.rollback();
            return res.status(404).json({ mensaje: 'Parte no encontrado' });
        }
        if (req.usuario.rol !== ROLES.ADMIN || Number(parte.sucursalId) !== Number(req.usuario.sucursalId)) {
            await t.rollback();
            return res.status(403).json({ mensaje: 'Solo un encargado de la sucursal puede resolver el parte' });
        }
        if (parte.estado === 'RESUELTO') {
            await t.rollback();
            return res.status(409).json({ code: 'El parte ya está resuelto' });
        }

        const ahora = new Date();
        const nota = (req.body.nota ?? '').trim();
        await parte.update({
            estado: 'RESUELTO',
            resueltoPorId: req.usuario.id,
            resueltoEn: ahora,
            nota: nota || null,
            ...(parte.vistoPorId ? {} : { vistoPorId: req.usuario.id, vistoEn: ahora }),
        }, { transaction: t });

        // Los avisos de este parte dejan de figurar como pendientes para todos los encargados
        await Notificacion.update(
            { leidaEn: ahora },
            { where: { parteId: parte.id, tipo: 'PARTE', leidaEn: null }, transaction: t },
        );
        // Y el empleado se entera de que lo resolvieron
        await notificar([parte.creadoPorId], {
            tipo: 'PARTE_RESUELTO',
            titulo: 'Tu parte fue resuelto',
            mensaje: recortar(nota ? `${req.usuario.nombre}: ${nota}` : `${req.usuario.nombre} resolvió tu parte`, 300),
            parteId: parte.id,
        }, t);

        await t.commit();
        return res.json({ estado: 'RESUELTO' });
    } catch (error) {
        await t.rollback();
        console.error('Error al resolver el parte:', error.message);
        return res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

module.exports = { crear, listar, resolver };
