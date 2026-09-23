const { Router } = require('express');
const router = Router();

const adminController = require('../../controllers/admin/adminController');
const { validarLoginAdmin } = require('../../middleware/admin/validarLoginAdmin');
const { validarAdmin } = require('../../middleware/admin/validarAdmin');
const { validarUpdateAdmin } = require('../../middleware/admin/validarUpdateAdmin');
const { esIdValido } = require('../../middleware/esIdValido');

router.post('/login', validarLoginAdmin, adminController.login)

router.get('/administradores', adminController.verAdmins)

router.get('/:id', esIdValido, adminController.obtenerAdminPorId)

router.post('/administradores/nuevo', validarAdmin, adminController.crearAdmin)

router.put('/administradores/editar/:id', validarUpdateAdmin, esIdValido, adminController.actualizarAdmin)

router.delete('/eliminar/:id', esIdValido, adminController.eliminarAdmin);


module.exports = router;