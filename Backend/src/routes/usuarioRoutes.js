const { Router } = require('express');
const router = Router();

const usuarioController = require('../controllers/usuarioController');
const usuarioValidaciones = require('../middleware/validarUsuario')
const { autenticarUsuario } = require('../middleware/autenticacion');

router.get('/', usuarioController.verUsuarios)

router.post('/', usuarioValidaciones.validarUsuario ,usuarioController.crearUsuario )

router.post('/login', usuarioValidaciones.validarLogin, usuarioController.login)

// Revalidación de sesión del cliente: el usuario sale del token (va antes de /:id)
router.get('/me', autenticarUsuario, usuarioController.obtenerMiUsuario)

router.get('/:id', usuarioController.obtenerUsuarioPorId)

router.put('/:id', usuarioValidaciones.validarActualizarUsuario, usuarioController.actualizarUsuario)

router.put('/:id/sucursal', usuarioController.actualizarSucursalPredeterminada)

router.post('/recuperar-password', usuarioController.solicitarRecuperacion)

router.post('/restablecer-password', usuarioController.restablecerPassword)

module.exports = router;