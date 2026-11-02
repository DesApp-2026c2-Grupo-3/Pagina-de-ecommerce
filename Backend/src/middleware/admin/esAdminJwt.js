const { resolverIdentidad } = require('../../services/authService');
const { limpiarCookieSesion } = require('../../utils/sesionAdmin');

function leerToken(req) {
    const header = req.headers?.authorization ?? '';
    if (header.startsWith('Bearer ')) {
        return header.slice(7) || null;
    }
    return req.cookies?.access_token ?? null;
}

const esAdminJwt = async (req, res, next) => {
    const token = leerToken(req);

    if (!token) {
        return res.status(401).json({ msj: 'Acceso no autorizado' });
    }

    let identidad;
    try {
        identidad = await resolverIdentidad(token);
    } catch (error) {
        if (!error?.codigo) {
            console.error(error);
            return res.status(500).json({ msj: 'Error del servidor' });
        }
        limpiarCookieSesion(res);
        return res.status(401).json({ msj: 'Token inválido o expirado' });
    }

    if (identidad.tipo !== 'admin') {
        return res.status(403).json({ msj: 'Acceso no autorizado' });
    }

    req.identidad = identidad;
    req.admin = identidad;
    req.usuario = {
        id: identidad.id,
        nombre: identidad.nombre,
        rol: identidad.rol,
    };

    return next();
};

module.exports = { esAdminJwt };
