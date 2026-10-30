
const { Router } = require('express');
const router = Router();

const repartidorController = require('../../controllers/admin/repartidorController');
const { esAdminJwt } = require('../../middleware/admin/esAdminJwt');
const {validarRepartidor} = require('../../middleware/admin/validarRepartidor');

// Listar repartidores
router.get('/', esAdminJwt, repartidorController.verRepartidores);

// Crear repartidor
router.post('/', esAdminJwt, validarRepartidor, repartidorController.crearRepartidor);

module.exports = router;
