// Roles del panel de administración.
// ADMIN es el encargado de una sucursal (así se guarda en la base; el panel lo muestra como "Encargado").
const ROLES = Object.freeze({
    MASTER: 'MASTER',
    ADMIN: 'ADMIN',
    EMPLEADO: 'EMPLEADO',
});

module.exports = { ROLES };
