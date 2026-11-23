const express = require('express');
const router = express.Router();

const { obtenerPedidosDisponibles, retirarPedido, entregarPedido } = require('../../controllers/repartidor/pedidoRepartidorController');

const { esRepartidorJwt } = require('../../middleware/repartidor/esRepartidorJwt');

router.get('/disponibles', esRepartidorJwt, obtenerPedidosDisponibles);

// D-07: retirar del local (no cambia el estado) y entregar al cliente
router.patch('/:pedidoId/retirar', esRepartidorJwt, retirarPedido);

router.patch('/:pedidoId/entregar', esRepartidorJwt, entregarPedido);

module.exports = router;
