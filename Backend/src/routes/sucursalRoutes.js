const express = require('express');
const { obtenerSucursales } = require('../controllers/sucursalController');

const router = express.Router();

router.get('/', obtenerSucursales);

module.exports = router;
