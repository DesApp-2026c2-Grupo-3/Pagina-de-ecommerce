const { Router } = require('express');
const router = Router();

const insumoController = require('../../controllers/admin/insumoController');
const { validarInsumo } = require('../../middleware/admin/validarInsumo');
const { esIdValido } = require('../../middleware/esIdValido');

router.get('/', insumoController.obtenerInsumos);
router.post('/nuevo', validarInsumo, insumoController.crearInsumo);
router.patch('/editar/:id', esIdValido, validarInsumo, insumoController.editarInsumo);
router.delete('/eliminar/:id', esIdValido, insumoController.eliminarInsumo);

module.exports = router;