const bcrypt = require('bcrypt');
const { Admin, Sucursal } = require('../../models');
const { ROLES } = require('../../config/roles');

// GET /admin/perfil — los datos de quien está logueado y quiénes son los encargados de su sucursal
const obtener = async (req, res) => {
    try {
        const admin = await Admin.findByPk(req.usuario.id, {
            attributes: ['id', 'nombre', 'email', 'rol', 'sucursalId', 'createdAt'],
            include: [{ model: Sucursal, attributes: ['id', 'nombre'] }],
        });
        if (!admin) {
            return res.status(404).json({ mensaje: 'Administrador no encontrado' });
        }

        const encargados = admin.sucursalId
            ? await Admin.findAll({
                where: { rol: ROLES.ADMIN, sucursalId: admin.sucursalId, activo: true },
                attributes: ['id', 'nombre'],
                order: [['nombre', 'ASC']],
            })
            : [];

        res.json({
            id: admin.id,
            nombre: admin.nombre,
            email: admin.email,
            rol: admin.rol,
            sucursal: admin.Sucursal ? { id: admin.Sucursal.id, nombre: admin.Sucursal.nombre } : null,
            desde: admin.createdAt,
            encargados: encargados.map((e) => ({ id: e.id, nombre: e.nombre })),
        });
    } catch (error) {
        console.error('Error al obtener el perfil:', error.message);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

// PATCH /admin/perfil/password   { passwordActual, passwordNueva }
const cambiarPassword = async (req, res) => {
    try {
        const { passwordActual, passwordNueva } = req.body;
        const admin = await Admin.findByPk(req.usuario.id);
        if (!admin) {
            return res.status(404).json({ mensaje: 'Administrador no encontrado' });
        }

        // 400 y no 401: un 401 le haría pensar al panel que se venció la sesión
        const coincide = await bcrypt.compare(passwordActual, admin.password);
        if (!coincide) {
            return res.status(400).json({ code: 'La contraseña actual no es correcta' });
        }
        if (passwordNueva === passwordActual) {
            return res.status(400).json({ code: 'La contraseña nueva tiene que ser distinta de la actual' });
        }

        await admin.update({ password: await bcrypt.hash(passwordNueva, 10) });
        res.json({ mensaje: 'Contraseña actualizada' });
    } catch (error) {
        console.error('Error al cambiar la contraseña:', error.message);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

module.exports = { obtener, cambiarPassword };
