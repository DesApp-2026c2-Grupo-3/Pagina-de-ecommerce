const express = require('express');
const router = express.Router();

const { esRepartidorJwt } = require('../../middleware/repartidor/esRepartidorJwt')
const { login, logout, obtenerSesion } = require('../../controllers/repartidor/authRepartidorController');

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', esRepartidorJwt, obtenerSesion);
module.exports = router;