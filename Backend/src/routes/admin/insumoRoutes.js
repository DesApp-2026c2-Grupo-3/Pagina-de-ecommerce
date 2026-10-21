const { Router } = require('express');
const router = Router();

const insumoController = require('../../controllers/admin/insumoController');
const { validarInsumo } = require('../../middleware/admin/validarInsumo');
const { esIdValido } = require('../../middleware/esIdValido');
const { esMasterJwt } = require('../../middleware/admin/esMasterJwt');
const { esAdminJwt } = require('../../middleware/admin/esAdminJwt');

router.get('/', esAdminJwt, insumoController.obtenerInsumos);
router.post('/nuevo', esMasterJwt, validarInsumo, insumoController.crearInsumo);
router.patch('/editar/:id', esIdValido, validarInsumo, insumoController.editarInsumo);
router.delete('/eliminar/:id', esMasterJwt, esIdValido, insumoController.eliminarInsumo);

module.exports = router;