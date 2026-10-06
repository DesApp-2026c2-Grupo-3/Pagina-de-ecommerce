const { Router } = require('express');
const router = Router();

const adminController = require('../../controllers/admin/adminController');
const { validarLoginAdmin } = require('../../middleware/admin/validarLoginAdmin');
const { validarAdmin } = require('../../middleware/admin/validarAdmin');
const { validarUpdateAdmin } = require('../../middleware/admin/validarUpdateAdmin');
const { esIdValido } = require('../../middleware/esIdValido');
const { esMasterJwt } = require('../../middleware/admin/esMasterJwt');

router.post('/login', validarLoginAdmin, adminController.login)

router.post('/logout', adminController.logout)

router.get('/administradores', esMasterJwt, adminController.verAdmins)

router.get('/:id', esMasterJwt, esIdValido, adminController.obtenerAdminPorId)

router.post('/administradores/nuevo', esMasterJwt, validarAdmin, adminController.crearAdmin)

router.put('/administradores/editar/:id', esMasterJwt, validarUpdateAdmin, esIdValido, adminController.actualizarAdmin)

router.delete('/eliminar/:id', esMasterJwt, esIdValido, adminController.eliminarAdmin);


module.exports = router;