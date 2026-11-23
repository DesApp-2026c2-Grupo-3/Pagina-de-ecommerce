const { Admin, Calificacion, Usuario, Sucursal } = require('../../models');

const ESTADOS = ['PENDIENTE', 'APROBADA', 'OCULTA'];

// El master ve todas; el admin de sucursal, solo las de su sucursal.
// Devuelve el filtro a aplicar, o null si el admin no existe.
async function filtroDelAdmin(req) {
    const admin = await Admin.findByPk(req.usuario.id);
    if (!admin) return null;
    return admin.sucursalId !== null ? { sucursalId: admin.sucursalId } : {};
}

// GET /admin/calificaciones?estado=PENDIENTE → la lista para moderar, de la más nueva a la más vieja
const obtenerCalificaciones = async (req, res) => {
    try {
        const where = await filtroDelAdmin(req);
        if (!where) return res.status(401).json({ mensaje: 'Iniciá sesión de nuevo' });

        const { estado } = req.query;
        if (estado) {
            if (!ESTADOS.includes(estado)) return res.status(400).json({ mensaje: 'El estado no es válido' });
            where.estado = estado;
        }

        const calificaciones = await Calificacion.findAll({
            where,
            include: [
                { model: Usuario, as: 'usuario', attributes: ['nombre'] },
                { model: Sucursal, as: 'sucursal', attributes: ['nombre'] },
            ],
            order: [['createdAt', 'DESC']],
        });

        return res.json(calificaciones.map((c) => ({
            id: c.id,
            nombre: c.usuario?.nombre ?? 'Cliente',
            puntaje: c.puntaje,
            comentario: c.comentario,
            fecha: c.createdAt,
            estado: c.estado,
            sucursal: c.sucursal?.nombre ?? 'Sin sucursal',
        })));
    } catch (error) {
        console.error('Error al obtener las calificaciones:', error.message);
        return res.status(500).json({ mensaje: 'Error al obtener las calificaciones' });
    }
};

// PATCH /admin/calificaciones/:id/estado  { estado: 'APROBADA' | 'OCULTA' }
const cambiarEstado = async (req, res) => {
    try {
        const where = await filtroDelAdmin(req);
        if (!where) return res.status(401).json({ mensaje: 'Iniciá sesión de nuevo' });

        const { estado } = req.body;
        if (estado !== 'APROBADA' && estado !== 'OCULTA') {
            return res.status(400).json({ mensaje: 'El estado debe ser APROBADA u OCULTA' });
        }

        // El filtro evita que un admin de sucursal modere calificaciones de otra sucursal
        const calificacion = await Calificacion.findOne({ where: { ...where, id: req.params.id } });
        if (!calificacion) return res.status(404).json({ mensaje: 'Calificación no encontrada' });

        await calificacion.update({ estado });
        return res.json({ mensaje: estado === 'APROBADA' ? 'Calificación aprobada' : 'Calificación oculta', id: calificacion.id, estado });
    } catch (error) {
        console.error('Error al cambiar el estado de la calificación:', error.message);
        return res.status(500).json({ mensaje: 'Error al cambiar el estado' });
    }
};

module.exports = { obtenerCalificaciones, cambiarEstado };