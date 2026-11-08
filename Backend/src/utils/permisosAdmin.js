const { ROLES } = require('../config/roles');

// Rol con el que queda un admin nuevo según quién lo crea:
// el master crea encargados (ADMIN) y el encargado crea empleados. El empleado no crea a nadie.
const rolQueCrea = (actor) => {
    if (actor?.rol === ROLES.MASTER) return ROLES.ADMIN;
    if (actor?.rol === ROLES.ADMIN) return ROLES.EMPLEADO;
    return null;
};

// El master gestiona a cualquiera; el encargado, solo a los empleados de su propia sucursal.
const puedeGestionar = (actor, objetivo) => {
    if (!actor || !objetivo) return false;
    if (actor.rol === ROLES.MASTER) return true;
    if (actor.rol === ROLES.ADMIN) {
        return objetivo.rol === ROLES.EMPLEADO
            && actor.sucursalId != null
            && Number(objetivo.sucursalId) === Number(actor.sucursalId);
    }
    return false;
};

module.exports = { rolQueCrea, puedeGestionar };
