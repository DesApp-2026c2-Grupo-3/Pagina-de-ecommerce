'use strict';

const { Router } = require('express');
const notificacionController = require('../controllers/notificacionController');
const { esAdminJwt } = require('../middleware/admin/esAdminJwt');
const { esIdValido } = require('../middleware/esIdValido');

const router = Router();

router.use(esAdminJwt);

router.get('/', notificacionController.listar);
router.get('/no-leidas/count', notificacionController.contarNoLeidas);
router.patch('/leer-todas', notificacionController.marcarTodasLeidas);
router.patch('/:id/leida', esIdValido, notificacionController.marcarLeida);

module.exports = router;
