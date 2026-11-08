const { Notificacion, Parte } = require('../../models');
const { ROLES } = require('../../config/roles');

const datosDe = (n) => ({
    id: n.id,
    tipo: n.tipo,
    titulo: n.titulo,
    mensaje: n.mensaje,
    parteId: n.parteId,
    leida: Boolean(n.leidaEn),
    creada: n.createdAt,
});

// Cuando un encargado abre el aviso de un parte, el parte pasa de ENVIADO a VISTO
async function marcarPartesVistos(parteIds, usuario, ahora) {
    const ids = parteIds.filter(Boolean);
    if (usuario.rol !== ROLES.ADMIN || ids.length === 0) return;
    await Parte.update(
        { estado: 'VISTO', vistoPorId: usuario.id, vistoEn: ahora },
        { where: { id: ids, estado: 'ENVIADO', sucursalId: usuario.sucursalId } },
    );
}

// GET /admin/notificaciones — las últimas 30 y cuántas quedan sin leer (la campanita las consulta cada 30 s)
const listar = async (req, res) => {
    try {
        const destinatarioId = req.usuario.id;
        const [items, noLeidas] = await Promise.all([
            Notificacion.findAll({ where: { destinatarioId }, order: [['createdAt', 'DESC']], limit: 30 }),
            Notificacion.count({ where: { destinatarioId, leidaEn: null } }),
        ]);
        res.json({ noLeidas, items: items.map(datosDe) });
    } catch (error) {
        console.error('Error al listar las notificaciones:', error.message);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

// PATCH /admin/notificaciones/:id/leida
const marcarLeida = async (req, res) => {
    try {
        const notificacion = await Notificacion.findOne({ where: { id: req.params.id, destinatarioId: req.usuario.id } });
        if (!notificacion) {
            return res.status(404).json({ mensaje: 'Notificación no encontrada' });
        }
        const ahora = new Date();
        if (!notificacion.leidaEn) await notificacion.update({ leidaEn: ahora });
        await marcarPartesVistos([notificacion.parteId], req.usuario, ahora);
        res.json({ ok: true });
    } catch (error) {
        console.error('Error al marcar la notificación:', error.message);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

// PATCH /admin/notificaciones/leidas
const marcarTodas = async (req, res) => {
    try {
        const destinatarioId = req.usuario.id;
        const pendientes = await Notificacion.findAll({ where: { destinatarioId, leidaEn: null }, attributes: ['id', 'parteId'] });
        if (pendientes.length === 0) return res.json({ marcadas: 0 });

        const ahora = new Date();
        await Notificacion.update({ leidaEn: ahora }, { where: { destinatarioId, leidaEn: null } });
        await marcarPartesVistos(pendientes.map((n) => n.parteId), req.usuario, ahora);
        res.json({ marcadas: pendientes.length });
    } catch (error) {
        console.error('Error al marcar las notificaciones:', error.message);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

module.exports = { listar, marcarLeida, marcarTodas };
