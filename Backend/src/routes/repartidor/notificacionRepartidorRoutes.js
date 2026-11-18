'use strict';

const { Router } = require('express');
const notificacionRepartidorController = require('../../controllers/repartidor/notificacionRepartidorController');
const { esRepartidorJwt } = require('../../middleware/repartidor/esRepartidorJwt');
const { esIdValido } = require('../../middleware/esIdValido');

const router = Router();

router.use(esRepartidorJwt);

router.get('/', notificacionRepartidorController.listar);
router.get('/no-leidas/count', notificacionRepartidorController.contarNoLeidas);
router.patch('/leer-todas', notificacionRepartidorController.marcarTodasLeidas);
router.patch('/:id/leida', esIdValido, notificacionRepartidorController.marcarLeida);

module.exports = router;
