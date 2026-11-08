const { Router } = require('express');
const router = Router();

const perfilController = require('../../controllers/admin/perfilController');
const { esPersonalJwt } = require('../../middleware/admin/autenticarRoles');
const { validarCambioPassword } = require('../../middleware/admin/validarPerfil');

router.get('/', esPersonalJwt, perfilController.obtener);
router.patch('/password', esPersonalJwt, validarCambioPassword, perfilController.cambiarPassword);

module.exports = router;
