const jwt = require('jsonwebtoken');
const { limpiarCookieSesion } = require('../../utils/sesionAdmin');
const { Admin } = require('../../models');
const { ROLES } = require('../../config/roles');

// Igual que esAdminJwt, pero con la lista de roles que pueden pasar.
// El rol se vuelve a comprobar contra la base, no solo contra lo que dice el token.
const autenticarRoles = (rolesPermitidos) => async (req, res, next) => {
    try {
        const token = req.cookies.access_token;
        if (!token) {
            return res.status(401).json({ msj: 'Acceso no autorizado' });
        }
        const data = jwt.verify(token, process.env.SECRET_JWT_TOKEN);

        if (!rolesPermitidos.includes(data.rol)) {
            return res.status(403).json({ msj: 'Acceso no autorizado' });
        }

        const admin = await Admin.findByPk(data.id);
        if (!admin || !admin.activo || !rolesPermitidos.includes(admin.rol)) {
            limpiarCookieSesion(res);
            return res.status(401).json({ msj: 'La sesión no es válida o el administrador está inactivo' });
        }

        req.usuario = {
            id: admin.id,
            nombre: admin.nombre,
            rol: admin.rol,
            sucursalId: admin.sucursalId ?? null
        };
        return next();
    } catch (error) {
        limpiarCookieSesion(res);
        return res.status(401).json({ msj: 'Token inválido o expirado' });
    }
};

// Cualquier integrante del personal: master, encargado o empleado
const esPersonalJwt = autenticarRoles([ROLES.MASTER, ROLES.ADMIN, ROLES.EMPLEADO]);
// Solo el empleado (quien gestiona los pedidos de su sucursal)
const esEmpleadoJwt = autenticarRoles([ROLES.EMPLEADO]);

module.exports = { autenticarRoles, esPersonalJwt, esEmpleadoJwt };
