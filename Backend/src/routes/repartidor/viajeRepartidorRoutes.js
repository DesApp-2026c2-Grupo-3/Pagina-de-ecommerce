const express = require('express');
const router = express.Router();

const { iniciarViaje, obtenerViajeActivo, } = require('../../controllers/repartidor/viajeRepartidorController');

const { esRepartidorJwt } = require('../../middleware/repartidor/esRepartidorJwt');

router.post('/', esRepartidorJwt, iniciarViaje);

router.get('/activo', esRepartidorJwt, obtenerViajeActivo);

module.exports = router;