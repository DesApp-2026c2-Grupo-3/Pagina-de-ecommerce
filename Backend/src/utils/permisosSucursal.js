// El master (sin sucursal) puede todo; el admin de sucursal, solo la suya
function puedeVerSucursal(identidad, sucursalId) {
    return Boolean(identidad) && (
        identidad.rol === 'MASTER' ||
        Number(identidad.sucursalId) === Number(sucursalId)
    );
}

function motivoSinAcceso(identidad, sucursalId) {
    if (!identidad) return 401;
    return puedeVerSucursal(identidad, sucursalId) ? null : 403;
}

function mensajeSinAcceso(estado) {
    return estado === 401
        ? 'Acceso no autorizado'
        : 'No tienes permisos para acceder a esta sucursal';
}

module.exports = { puedeVerSucursal, motivoSinAcceso, mensajeSinAcceso };
