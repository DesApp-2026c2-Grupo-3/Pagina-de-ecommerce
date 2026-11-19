const { Router } = require('express');
const router = Router();

const promocionController = require('../../controllers/admin/promocionController');
const { validarPromocion } = require('../../middleware/admin/validarPromocion');
const { esIdValido } = require('../../middleware/esIdValido');
const { esMasterJwt } = require('../../middleware/admin/esMasterJwt');

// Armar, modificar, habilitar y eliminar promociones: solo el Admin-Master (también consultarlas)
router.get('/', esMasterJwt, promocionController.obtenerPromociones);
router.get('/:id', esMasterJwt, esIdValido, promocionController.obtenerPromocionPorId);
router.post('/nueva', esMasterJwt, validarPromocion, promocionController.crearPromocion);
router.patch('/editar/:id', esMasterJwt, esIdValido, validarPromocion, promocionController.editarPromocionPorId);
router.patch('/:id/deshabilitar', esMasterJwt, esIdValido, promocionController.deshabilitarPromocion);
router.patch('/:id/habilitar', esMasterJwt, esIdValido, promocionController.habilitarPromocion);
router.delete('/eliminar/:id', esMasterJwt, esIdValido, promocionController.eliminarPromocion);

module.exports = router;
