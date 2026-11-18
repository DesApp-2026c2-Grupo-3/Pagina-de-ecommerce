const express = require('express');
const router = express.Router();

const { esRepartidorJwt } = require('../../middleware/repartidor/esRepartidorJwt');
const { validarLoginRepartidor } = require('../../middleware/repartidor/validarLoginRepartidor');
const { login, obtenerSesion } = require('../../controllers/repartidor/authRepartidorController');

router.post('/login', validarLoginRepartidor, login);
router.get('/me', esRepartidorJwt, obtenerSesion);

module.exports = router;
