const { Router } = require('express');
const router = Router();

const usuarioController = require('../controllers/usuarioController');
const usuarioValidaciones = require('../middleware/validarUsuario')

router.get('/', usuarioController.verUsuarios)

router.post('/', usuarioValidaciones.validarUsuario ,usuarioController.crearUsuario )

router.post('/login', usuarioValidaciones.validarLogin, usuarioController.login)

module.exports = router;