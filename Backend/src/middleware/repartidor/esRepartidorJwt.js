const { resolverIdentidad } = require('../../services/authService');

// La app del repartidor manda el token solo por "Authorization: Bearer <token>" (sin cookies)
function leerBearer(req) {
    const header = req.headers?.authorization ?? '';
    if (!header.startsWith('Bearer ')) return null;
    return header.slice(7).trim() || null;
}

// Exige un repartidor activo; deja su identidad en req.identidad y su id y sucursal en req.repartidor
const esRepartidorJwt = async (req, res, next) => {
    const token = leerBearer(req);

    if (!token) {
        return res.status(401).json({ mensaje: 'Iniciá sesión para continuar' });
    }

    let identidad;
    try {
        // Verifica el token y que el repartidor exista, esté activo y no esté dado de baja
        identidad = await resolverIdentidad(token);
    } catch (error) {
        if (!error?.codigo) {
            console.error('Error al autenticar repartidor:', error);
            return res.status(500).json({ mensaje: 'Error del servidor' });
        }
        return res.status(401).json({ mensaje: 'Tu sesión venció. Iniciá sesión de nuevo' });
    }

    if (identidad.tipo !== 'repartidor') {
        return res.status(403).json({ mensaje: 'Acceso no autorizado' });
    }

    req.identidad = identidad;
    req.repartidor = {
        id: identidad.id,
        sucursalId: identidad.sucursalId,
    };

    return next();
};

module.exports = { esRepartidorJwt };
