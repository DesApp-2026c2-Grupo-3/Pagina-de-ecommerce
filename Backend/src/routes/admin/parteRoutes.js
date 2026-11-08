const { Router } = require('express');
const router = Router();

const parteController = require('../../controllers/admin/parteController');
const { esIdValido } = require('../../middleware/esIdValido');
const { esAdminJwt } = require('../../middleware/admin/esAdminJwt');
const { esPersonalJwt, esEmpleadoJwt } = require('../../middleware/admin/autenticarRoles');
const { validarParte, validarResolverParte } = require('../../middleware/admin/validarParte');

// Solo el empleado da partes. Cada rol ve lo suyo. Solo el encargado de la sucursal los resuelve.
router.post('/', esEmpleadoJwt, validarParte, parteController.crear);
router.get('/', esPersonalJwt, parteController.listar);
router.patch('/:id/resolver', esIdValido, esAdminJwt, validarResolverParte, parteController.resolver);

module.exports = router;
