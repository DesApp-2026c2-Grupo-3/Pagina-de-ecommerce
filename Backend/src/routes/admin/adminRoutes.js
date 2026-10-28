const { Router } = require('express');
const router = Router();

const adminController = require('../../controllers/admin/adminController');
const { validarLoginAdmin } = require('../../middleware/admin/validarLoginAdmin');
const { validarAdmin } = require('../../middleware/admin/validarAdmin');
const { validarUpdateAdmin } = require('../../middleware/admin/validarUpdateAdmin');
const { esIdValido } = require('../../middleware/esIdValido');
const { esAdminJwt } = require('../../middleware/admin/esAdminJwt');

router.post('/login', validarLoginAdmin, adminController.login)

router.post('/logout', adminController.logout)

// Master y encargado gestionan administradores. A quién puede gestionar cada uno
// (el master, a todos; el encargado, solo a los empleados de su sucursal) lo decide el controller.
router.get('/administradores', esAdminJwt, adminController.verAdmins)

router.get('/:id', esAdminJwt, esIdValido, adminController.obtenerAdminPorId)

router.post('/administradores/nuevo', esAdminJwt, validarAdmin, adminController.crearAdmin)

router.put('/administradores/editar/:id', esAdminJwt, validarUpdateAdmin, esIdValido, adminController.actualizarAdmin)

router.delete('/administradores/eliminar/:id', esAdminJwt, esIdValido, adminController.eliminarAdmin);

router.patch('/administradores/reactivar/:id', esAdminJwt, esIdValido, adminController.reactivarAdmin);


module.exports = router;