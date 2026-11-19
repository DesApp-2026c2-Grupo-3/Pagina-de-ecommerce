'use strict';

const { Router } = require('express');
const notificacionClienteController = require('../controllers/notificacionClienteController');
const { autenticarUsuario } = require('../middleware/autenticacion');
const { esIdValido } = require('../middleware/esIdValido');

const router = Router();

router.use(autenticarUsuario);

router.get('/', notificacionClienteController.listar);
router.get('/no-leidas/count', notificacionClienteController.contarNoLeidas);
router.patch('/leer-todas', notificacionClienteController.marcarTodasLeidas);
router.patch('/:id/leida', esIdValido, notificacionClienteController.marcarLeida);

module.exports = router;
