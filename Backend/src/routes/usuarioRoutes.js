const { Router } = require('express');
const router = Router();

const usuarioController = require('../controllers/usuarioController');
const usuarioValidaciones = require('../middleware/validarUsuario')
const { autenticarUsuario, autenticarCualquiera, esPropietarioOAdmin } = require('../middleware/autenticacion');
const { esAdminJwt } = require('../middleware/admin/esAdminJwt');
const { esIdValido } = require('../middleware/esIdValido');

// Listado completo: solo administradores
router.get('/', esAdminJwt, usuarioController.verUsuarios)

router.post('/', usuarioValidaciones.validarUsuario ,usuarioController.crearUsuario )

router.post('/login', usuarioValidaciones.validarLogin, usuarioController.login)

// Revalidación de sesión del cliente: el usuario sale del token (va antes de /:id)
router.get('/me', autenticarUsuario, usuarioController.obtenerMiUsuario)

// Perfil por id: solo el dueño o un administrador
router.get('/:id', esIdValido, autenticarCualquiera, esPropietarioOAdmin(), usuarioController.obtenerUsuarioPorId)

router.put('/:id', esIdValido, autenticarCualquiera, esPropietarioOAdmin(), usuarioValidaciones.validarActualizarUsuario, usuarioController.actualizarUsuario)

router.put('/:id/sucursal', esIdValido, autenticarCualquiera, esPropietarioOAdmin(), usuarioController.actualizarSucursalPredeterminada)

router.post('/recuperar-password', usuarioController.solicitarRecuperacion)

router.post('/restablecer-password', usuarioController.restablecerPassword)

module.exports = router;