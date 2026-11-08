const { Router } = require('express');
const router = Router();

const notificacionController = require('../../controllers/admin/notificacionController');
const { esIdValido } = require('../../middleware/esIdValido');
const { esPersonalJwt } = require('../../middleware/admin/autenticarRoles');

// Cada administrador (master, encargado o empleado) ve solo las suyas
router.get('/', esPersonalJwt, notificacionController.listar);
router.patch('/leidas', esPersonalJwt, notificacionController.marcarTodas);
router.patch('/:id/leida', esIdValido, esPersonalJwt, notificacionController.marcarLeida);

module.exports = router;
