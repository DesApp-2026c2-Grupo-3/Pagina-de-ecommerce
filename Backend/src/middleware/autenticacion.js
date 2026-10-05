const { verificarToken } = require('../utils/jwt');
const { Admin } = require('../models');

// Lee el token del header "Authorization: Bearer <token>"
function leerToken(req) {
    const header = req.headers.authorization ?? '';
    return header.startsWith('Bearer ') ? header.slice(7) : null;
}

// ---------- Clientes ----------

// Exige un cliente con sesión iniciada; deja su id en req.usuario
const autenticarUsuario = (req, res, next) => {
    const token = leerToken(req);
    if (!token) {
        return res.status(401).json({ mensaje: 'Iniciá sesión para continuar' });
    }
    try {
        const datos = verificarToken(token);
        if (datos.tipo !== 'usuario') throw new Error('Token de otro tipo');
        req.usuario = { id: datos.id };
        next();
    } catch {
        return res.status(401).json({ mensaje: 'Tu sesión venció. Iniciá sesión de nuevo' });
    }
};

// ---------- Administradores ----------

// Exige un admin con sesión iniciada; deja su id, rol y sucursal en req.admin
const autenticarAdmin = async (req, res, next) => {
    const token = leerToken(req);
    if (!token) {
        return res.status(401).json({ mensaje: 'Iniciá sesión para continuar' });
    }

    let datos;
    try {
        datos = verificarToken(token);
    } catch {
        return res.status(401).json({ mensaje: 'Tu sesión venció. Iniciá sesión de nuevo' });
    }
    if (datos.tipo !== 'admin') {
        return res.status(401).json({ mensaje: 'Iniciá sesión como administrador' });
    }

    try {
        // Se lee de la base: si le cambiaron el rol o la sucursal, o lo eliminaron, aplica enseguida
        const admin = await Admin.findByPk(datos.id, { attributes: ['id', 'rol', 'sucursalId'] });
        if (!admin) {
            return res.status(401).json({ mensaje: 'Iniciá sesión de nuevo' });
        }
        req.admin = { id: admin.id, rol: admin.rol, sucursalId: admin.sucursalId };
        next();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensaje: 'Error del servidor' });
    }
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

module.exports = { autenticarUsuario, autenticarAdmin, soloMaster, deSuSucursal };