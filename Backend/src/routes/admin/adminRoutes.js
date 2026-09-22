const { Router } = require('express');
const router = Router();

const adminController = require('../../controllers/admin/adminController');

router.post('/login', adminController.login)

router.get('/administradores', adminController.verAdmins)

router.get('/:id', adminController.obtenerAdminPorId)

router.post('/administradores/nuevo', adminController.crearAdmin)

router.put('/administradores/editar/:id', adminController.actualizarAdmin)

router.delete('/eliminar/:id', adminController.eliminarAdmin);


module.exports = router;