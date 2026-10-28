
const { Router } = require('express');
const router = Router();

const repartidorController = require('../../controllers/admin/repartidorController');
const { esAdminJwt } = require('../../middleware/admin/esAdmin');
const { esMasterJwt } = require('../../middleware/admin/esMaster');

// Listar repartidores
router.get('/', esAdminJwt, repartidorController.verRepartidores);

// Crear repartidor
router.post('/', esAdminJwt, require('../../middleware/admin/validarRepartidor').validarRepartidor,
 repartidorController.crearRepartidor);

module.exports = router;
