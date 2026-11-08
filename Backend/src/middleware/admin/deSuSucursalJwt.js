const { StockSucursal } = require('../../models');

// Va DESPUÉS de esAdminJwt (que deja req.usuario = { id, nombre, rol, sucursalId }).
// Deja pasar al MASTER, o al ADMIN de la sucursal a la que pertenece lo que se pide.
// obtenerSucursalId(req) devuelve la sucursal dueña del recurso (null/undefined si no existe).
const deSuSucursalJwt = (obtenerSucursalId) => async (req, res, next) => {
    if (req.usuario?.rol === 'MASTER') return next();

    try {
        const sucursalId = await obtenerSucursalId(req);
        if (sucursalId == null) {
            return res.status(404).json({ mensaje: 'No encontrado' });
        }
        // Un admin sin sucursal asignada no puede gestionar ninguna
        if (req.usuario?.sucursalId == null || Number(sucursalId) !== Number(req.usuario.sucursalId)) {
            return res.status(403).json({ mensaje: 'Solo podés gestionar tu sucursal' });
        }
        return next();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

// La sucursal es la del :id de la URL (ej: /sucursal/:id/...)
const sucursalDeLaUrl = (req) => req.params.id;

// El :id de la URL es el de una fila de stock: la sucursal es la de esa fila
const sucursalDelStock = async (req) => {
    const stock = await StockSucursal.findByPk(req.params.id, { attributes: ['sucursalId'] });
    return stock?.sucursalId;
};

module.exports = { deSuSucursalJwt, sucursalDeLaUrl, sucursalDelStock };
