const { Router } = require('express');
const router = Router();

const sucursalController = require('../controllers/sucursalController');

router.get('/', sucursalController.obtenerSucursales);

module.exports = router;
