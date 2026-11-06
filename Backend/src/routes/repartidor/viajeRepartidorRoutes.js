const express = require('express');
const router = express.Router();

const { tomarPedidos, iniciarViaje, obtenerViajeActivo, obtenerHistorialViajes, solicitarAyuda, quitarPedidoDelViaje} = require('../../controllers/repartidor/viajeRepartidorController');

const { esRepartidorJwt } = require('../../middleware/repartidor/esRepartidorJwt');

router.post('/', esRepartidorJwt, tomarPedidos);

router.patch('/iniciar', esRepartidorJwt, iniciarViaje);

router.get('/activo', esRepartidorJwt, obtenerViajeActivo);

router.get('/historial', esRepartidorJwt, obtenerHistorialViajes);

router.post('/solicitar-ayuda', esRepartidorJwt, solicitarAyuda);

router.delete('/pedidos/:pedidoId', esRepartidorJwt, quitarPedidoDelViaje);

module.exports = router;