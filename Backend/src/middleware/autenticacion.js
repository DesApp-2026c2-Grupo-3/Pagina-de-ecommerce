const { resolverIdentidad } = require('../services/authService');

// Lee el token del header "Authorization: Bearer <token>" o de la cookie del panel
function leerToken(req) {
    const header = req.headers?.authorization ?? '';
    if (header.startsWith('Bearer ')) {
        return header.slice(7) || null;
    }
    return req.cookies?.access_token ?? null;
}

async function identificar(req) {
    const token = leerToken(req);
    if (!token) {
        return { error: 'AUTH_REQUIRED' };
    }

    try {
        return { identidad: await resolverIdentidad(token) };
    } catch (error) {
        if (error?.codigo) {
            return { error: error.codigo };
        }
        console.error(error);
        return { error: 'SERVER_ERROR' };
    }
}

// ---------- Clientes ----------

// Exige un cliente con sesión iniciada; deja su id en req.usuario
const autenticarUsuario = async (req, res, next) => {
    const { identidad, error } = await identificar(req);

    if (error === 'AUTH_REQUIRED') {
        return res.status(401).json({ mensaje: 'Iniciá sesión para continuar' });
    }
    if (error === 'SERVER_ERROR') {
        return res.status(500).json({ mensaje: 'Error del servidor' });
    }
    if (error || identidad.tipo !== 'cliente') {
        return res.status(401).json({ mensaje: 'Tu sesión venció. Iniciá sesión de nuevo' });
    }

    req.identidad = identidad;
    req.usuario = {
        id: identidad.id,
        nombre: identidad.nombre,
        sucursalId: identidad.sucursalId,
    };
    return next();
};

// ---------- Administradores ----------

// Exige un admin con sesión iniciada; deja su id, rol y sucursal en req.admin
const autenticarAdmin = async (req, res, next) => {
    const { identidad, error } = await identificar(req);

    if (error === 'AUTH_REQUIRED') {
        return res.status(401).json({ mensaje: 'Iniciá sesión para continuar' });
    }
    if (error === 'SERVER_ERROR') {
        return res.status(500).json({ mensaje: 'Error del servidor' });
    }
    if (error) {
        return res.status(401).json({ mensaje: 'Tu sesión venció. Iniciá sesión de nuevo' });
    }
    if (identidad.tipo !== 'admin') {
        return res.status(401).json({ mensaje: 'Iniciá sesión como administrador' });
    }

    req.identidad = identidad;
    req.admin = {
        id: identidad.id,
        nombre: identidad.nombre,
        rol: identidad.rol,
        sucursalId: identidad.sucursalId,
    };
    req.usuario = {
        id: identidad.id,
        nombre: identidad.nombre,
        rol: identidad.rol,
    };
    return next();
};

const autenticarCualquiera = async (req, res, next) => {
    const { identidad, error } = await identificar(req);

    if (error === 'AUTH_REQUIRED') {
        return res.status(401).json({ mensaje: 'Iniciá sesión para continuar' });
    }
    if (error === 'SERVER_ERROR') {
        return res.status(500).json({ mensaje: 'Error del servidor' });
    }
    if (error) {
        return res.status(401).json({ mensaje: 'Tu sesión venció. Iniciá sesión de nuevo' });
    }

    req.identidad = identidad;
    return next();
};

// Solo el administrador general
const soloMaster = (req, res, next) => {
    if (req.admin?.rol === 'MASTER') return next();
    return res.status(403).json({ mensaje: 'No tenés permiso para esta acción' });
};

// El master, o el admin de la sucursal a la que pertenece lo que se pide.
// obtenerSucursalId(req) dice de qué sucursal es (por ejemplo, la del :id de la URL)
const deSuSucursal = (obtenerSucursalId) => async (req, res, next) => {
    if (req.admin?.rol === 'MASTER') return next();
    try {
        const sucursalId = await obtenerSucursalId(req);
        if (sucursalId == null) {
            return res.status(404).json({ mensaje: 'No encontrado' });
        }
        if (Number(sucursalId) !== req.admin?.sucursalId) {
            return res.status(403).json({ mensaje: 'Solo podés gestionar tu sucursal' });
        }
        next();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

module.exports = {
    autenticarUsuario,
    autenticarAdmin,
    autenticarCualquiera,
    soloMaster,
    deSuSucursal,
};
