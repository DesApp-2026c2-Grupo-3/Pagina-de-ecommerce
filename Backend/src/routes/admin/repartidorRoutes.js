
const { Router } = require('express');
const router = Router();

const repartidorController = require('../../controllers/admin/repartidorController');
const { esAdminJwt } = require('../../middleware/admin/esAdminJwt');
const {validarRepartidor, validarActualizacionRepartidor} = require('../../middleware/admin/validarRepartidor');


router.get('/', esAdminJwt, repartidorController.verRepartidores);

router.post('/', esAdminJwt, validarRepartidor, repartidorController.crearRepartidor);

router.get('/:id', esAdminJwt, repartidorController.obtenerRepartidorPorId);

router.put('/:id', esAdminJwt, validarActualizacionRepartidor, repartidorController.actualizarRepartidor);

router.patch( '/:id/desactivar', esAdminJwt, repartidorController.desactivarRepartidor);

router.patch( '/:id/reactivar', esAdminJwt, repartidorController.reactivarRepartidor);

module.exports = router;
