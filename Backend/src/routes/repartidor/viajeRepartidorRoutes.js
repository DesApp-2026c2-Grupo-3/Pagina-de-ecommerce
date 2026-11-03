const express = require('express');
const router = express.Router();

const { iniciarViaje, obtenerViajeActivo, obtenerHistorialViajes } = require('../../controllers/repartidor/viajeRepartidorController');

const { esRepartidorJwt } = require('../../middleware/repartidor/esRepartidorJwt');

router.post('/', esRepartidorJwt, iniciarViaje);

router.get('/activo', esRepartidorJwt, obtenerViajeActivo);

router.get('/historial', esRepartidorJwt, obtenerHistorialViajes);

module.exports = router;