const express = require('express');
const router = express.Router();

const { obtenerPedidosDisponibles, actualizarEstadoPedido } = require('../../controllers/repartidor/pedidoRepartidorController');

const { esRepartidorJwt } = require('../../middleware/repartidor/esRepartidorJwt');

router.get('/disponibles', esRepartidorJwt, obtenerPedidosDisponibles);

router.patch('/:pedidoId/estado', esRepartidorJwt, actualizarEstadoPedido);

module.exports = router;